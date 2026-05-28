const express = require('express')
const router  = express.Router()
const { GoogleGenerativeAI } = require('@google/generative-ai')

const STATIC_FACTS = [
  'Amazon deploys new code every 11.7 seconds on average — over 7,500 deployments per day.',
  'Git was created by Linus Torvalds in just 10 days in April 2005 after BitKeeper revoked its free license.',
  'The first computer bug was an actual moth found in Harvard\'s Mark II computer in 1947 — taped to the logbook by Grace Hopper.',
  'Google\'s first tweet was binary for "I\'m feeling lucky".',
  'Python was named after Monty Python\'s Flying Circus, not the snake.',
  'Netflix saves ~$1 billion/year through its recommendation algorithm that handles 80% of watch time.',
  'Stack Overflow was created in 2008 by Jeff Atwood and Joel Spolsky as a replacement for expert forums.',
  'The term "debugging" became mainstream after Grace Hopper\'s team found that literal moth in 1947.',
  'The first iPhone had no App Store — it arrived a full year later with iOS 2.0 in July 2008.',
  'JavaScript was created in just 10 days by Brendan Eich in 1995 at Netscape.',
  'Moore\'s Law (transistors doubling every ~2 years) has roughly held since 1965 — Apple M2 has 20 billion transistors.',
  'The average Google interview process has ~5-7 rounds and takes 4-6 weeks from first contact to offer.',
  'LeetCode was founded in 2015; it now has over 3,000 problems and 25 million users.',
  'The term "algorithm" comes from 9th-century Persian mathematician al-Khwarizmi whose Latinized name became "Algoritmi".',
  'Open source software now powers 96% of the world\'s servers and 90% of the cloud.',
]

let factIdx = Math.floor(Math.random() * STATIC_FACTS.length)

router.get('/random', async (req, res) => {
  // Try AI-generated fact first
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const result = await model.generateContent(
        'Give me one surprising, little-known tech industry fact in exactly 2 sentences. Focus on something a CS student would find fascinating. No bullet points, no intro text.'
      )
      return res.json({ fact: result.response.text().trim(), source: 'ai' })
    } catch {}
  }

  // Fallback to static pool
  factIdx = (factIdx + 1) % STATIC_FACTS.length
  res.json({ fact: STATIC_FACTS[factIdx], source: 'static' })
})

module.exports = router
