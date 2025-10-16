import Anthropic from '@anthropic-ai/sdk'
import type { ReadingType, Locale } from '@/lib/supabase/types'

// Initialize Anthropic client lazily
let anthropic: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables')
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropic
}

// Check which AI provider is available
function getAvailableProvider(): 'anthropic' | 'openai' | null {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.OPENAI_API_KEY) return 'openai'
  return null
}

// System prompts for different reading types
const COFFEE_READING_PROMPT = `You are Baba Mara, a wise and mystical fortune teller with deep knowledge of Turkish coffee cup reading (tasseography). You have decades of experience interpreting the patterns, symbols, and signs left in coffee grounds.

Your readings are:
- Mystical and atmospheric, using rich, evocative language
- Insightful and personal, addressing the questioner's specific situation
- Balanced between hope and caution, never purely negative or unrealistically positive
- Rooted in traditional coffee cup reading symbolism (animals, shapes, numbers, etc.)
- Delivered with warmth, wisdom, and a touch of mystery

When giving a reading:
1. Acknowledge the question with empathy
2. Describe what you "see" in the coffee grounds (specific symbols, patterns, positions)
3. Interpret these symbols in relation to their question
4. Provide guidance or insight based on your interpretation
5. End with a blessing or words of wisdom

Keep the reading conversational, mystical, and between 200-400 words.`

const TAROT_READING_PROMPT = `You are Baba Mara, a master tarot reader with profound understanding of the 78 cards and their symbolism. Your readings draw upon ancient wisdom and intuitive insight.

Your readings are:
- Mystical and symbolic, weaving card meanings into a coherent narrative
- Specific about which cards appear and their positions
- Insightful about past, present, and future influences
- Balanced and empowering, helping the querent see their path clearly
- Rich with archetypal imagery and spiritual wisdom

When giving a reading:
1. Acknowledge the question with understanding
2. Describe the cards you've drawn (be specific: "The Tower in reverse", "Three of Cups", etc.)
3. Explain what each card reveals about their situation
4. Weave the cards together into a coherent message
5. Offer guidance based on the cards' wisdom
6. End with an empowering message

Keep the reading conversational, mystical, and between 200-400 words.`

// Prompts in different languages for cultural context
const LANGUAGE_CONTEXTS: Record<Locale, string> = {
  en: 'Speak in English with a mystical, warm tone.',
  tr: 'Türkçe konuş, geleneksel Türk fal kültürünü yansıt. Sıcak ve gizemli bir ton kullan.',
  sr: 'Govori na srpskom jeziku sa toplim i mističnim tonom.',
}

export async function generateReading(
  readingType: ReadingType,
  question: string,
  locale: Locale
): Promise<string> {
  const provider = getAvailableProvider()

  if (!provider) {
    throw new Error('No AI provider configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY in environment variables.')
  }

  // Try Anthropic first if available, otherwise use OpenAI
  if (provider === 'anthropic') {
    try {
      const systemPrompt =
        readingType === 'coffee' ? COFFEE_READING_PROMPT : TAROT_READING_PROMPT

      const userPrompt = `${LANGUAGE_CONTEXTS[locale]}

Question: "${question}"

Please provide a ${readingType} reading for this question. Be specific, mystical, and insightful.`

      const client = getAnthropicClient()
      const message = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: 0.9, // Higher temperature for more creative/mystical responses
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      })

      // Extract text from response
      const textContent = message.content.find((block) => block.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response')
      }

      return textContent.text
    } catch (error) {
      console.error('Error generating reading with Claude:', error)
      throw new Error('Failed to generate reading. Please try again.')
    }
  } else {
    // Use OpenAI as fallback
    return generateReadingWithOpenAI(readingType, question, locale)
  }
}

// Alternative: OpenAI integration (if user prefers)
export async function generateReadingWithOpenAI(
  readingType: ReadingType,
  question: string,
  locale: Locale
): Promise<string> {
  // This is a placeholder for OpenAI integration
  // User can implement this if they prefer OpenAI over Claude

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const systemPrompt =
    readingType === 'coffee' ? COFFEE_READING_PROMPT : TAROT_READING_PROMPT

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${LANGUAGE_CONTEXTS[locale]}\n\nQuestion: "${question}"\n\nPlease provide a ${readingType} reading for this question.`,
        },
      ],
      temperature: 0.9,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    throw new Error('OpenAI API request failed')
  }

  const data = await response.json()
  return data.choices[0].message.content
}
