const express = require('express')
const axios   = require('axios')
const router  = express.Router()
const { filterNewsRelevance } = require('../services/aiService')

const cache = new Map()
const TTL   = 60 * 60 * 1000  // 1 hour

router.get('/', async (req, res) => {
  const companies = (req.query.companies || '').split(',').map(s => s.trim()).filter(Boolean)
  if (!companies.length) return res.json([])

  const key = companies.sort().join(',')
  if (cache.has(key) && Date.now() - cache.get(key).ts < TTL) {
    return res.json(cache.get(key).data)
  }

  try {
    if (!process.env.NEWS_API_KEY) {
      // Return mock data if no API key
      return res.json(MOCK_NEWS(companies))
    }

    const query = companies.join(' OR ')
    const r = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        sortBy: 'publishedAt',
        pageSize: 20,
        language: 'en',
        apiKey: process.env.NEWS_API_KEY,
      }
    })

    let articles = r.data.articles || []

    // Tag each article with matching company
    articles = articles.map(a => {
      const co = companies.find(c => (a.title + a.description || '').toLowerCase().includes(c.toLowerCase()))
      return { ...a, company: co || companies[0] }
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
    console.error('News error:', err.message)
    res.json(MOCK_NEWS(companies))
  }
})

function MOCK_NEWS(companies) {
  return companies.flatMap(co => [
    { title: `${co} Expands Engineering Team in India`, description: `${co} announced plans to hire 500+ engineers focused on AI and cloud infrastructure.`, url: '#', publishedAt: new Date().toISOString(), source: { name: 'TechCrunch' }, company: co, relevance: 'high', aiSummary: 'Hiring expansion — great time to apply.' },
    { title: `${co} Open Sources New ML Framework`, description: `The open-source release includes tools for model optimization and distributed training.`, url: '#', publishedAt: new Date(Date.now() - 86400000).toISOString(), source: { name: 'InfoQ' }, company: co, relevance: 'medium', aiSummary: 'Signals ML investment — relevant for ML engineer roles.' },
  ])
}

module.exports = router
