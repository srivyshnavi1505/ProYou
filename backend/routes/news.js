import express from 'express'
import axios   from 'axios'
import { filterNewsRelevance } from '../services/aiService.js'

const router = express.Router()

const cache = new Map()
const TTL   = 60 * 60 * 1000  // 1 hour

router.get('/', async (req, res) => {
  const companies = Array.isArray(req.query.companies)
    ? req.query.companies.map(s => s.trim()).filter(Boolean)
    : (req.query.companies || '').split(',').map(s => s.trim()).filter(Boolean)

  if (!companies.length) return res.status(400).json({ message: 'No companies provided' })

  const key = companies.sort().join(',')
  if (cache.has(key) && Date.now() - cache.get(key).ts < TTL) {
    return res.json(cache.get(key).data)
  }

  try {
    if (!process.env.NEWS_API_KEY) {
      return res.json(MOCK_NEWS(companies))
    }

    const query = companies.join(' OR ')
    const r = await axios.get('https://newsdata.io/api/1/news', {
      params: {
        apikey: process.env.NEWS_API_KEY,
        q: query,
        language: 'en',
        category: 'technology,business',
      }
    })

    let articles = (r.data.results || []).map(a => {
      const co = companies.find(c =>
        (a.title + ' ' + (a.description || '')).toLowerCase().includes(c.toLowerCase())
      )
      return {
        title:       a.title,
        description: a.description || '',
        url:         a.link,
        publishedAt: a.pubDate,
        source:      { name: a.source_id },
        company:     co || companies[0],
      }
    })

    // AI relevance filter
    const relevanceMap = await filterNewsRelevance(articles, companies)
    if (relevanceMap?.length) {
      articles = articles.map((a, i) => {
        const r = relevanceMap.find(rm => rm.index === i)
        return r ? { ...a, relevance: r.relevance, aiSummary: r.summary } : a
      }).filter(a => a.relevance !== 'low')
    }

    cache.set(key, { ts: Date.now(), data: articles })
    res.json(articles)
  } catch (err) {
    console.error('News error:', err.response?.data || err.message)
    res.json(MOCK_NEWS(companies))
  }
})

function MOCK_NEWS(companies) {
  return companies.flatMap(co => [
    { title: `${co} Expands Engineering Team in India`, description: `${co} announced plans to hire 500+ engineers focused on AI and cloud infrastructure.`, url: '#', publishedAt: new Date().toISOString(), source: { name: 'TechCrunch' }, company: co, relevance: 'high', aiSummary: 'Hiring expansion — great time to apply.' },
    { title: `${co} Open Sources New ML Framework`, description: `The open-source release includes tools for model optimization and distributed training.`, url: '#', publishedAt: new Date(Date.now() - 86400000).toISOString(), source: { name: 'InfoQ' }, company: co, relevance: 'medium', aiSummary: 'Signals ML investment — relevant for ML engineer roles.' },
  ])
}

export default router