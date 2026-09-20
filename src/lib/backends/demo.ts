import type { Attachment } from '@/types/chat';

/**
 * Local demo responses. Forks can delete this folder (`src/lib/backends/demo.ts`
 * + its test) to strip demo mode entirely — nothing else imports demo copy.
 */
export function getDemoResponse(input: string, attachments?: Attachment[]): string {
  if (attachments && attachments.length > 0) {
    const names = attachments.map((a) => `**${a.name}** (${a.type})`).join(', ');
    return `I received the following file(s) in demo mode: ${names}.\n\nHow can I help you analyze them?`;
  }

  const normalizedInput = input.toLowerCase();

  if (
    normalizedInput.includes('python') ||
    normalizedInput.includes('snake') ||
    normalizedInput.includes('code') ||
    normalizedInput.includes('script')
  ) {
    return `Here's a simple Snake game in Python using the built-in \`turtle\` module (no external libraries required):

\`\`\`python
import turtle
import time
import random

# Screen setup
screen = turtle.Screen()
screen.title("Snake Game")
screen.bgcolor("black")
screen.setup(width=600, height=600)
screen.tracer(0)

# Snake head
head = turtle.Turtle()
head.speed(0)
head.shape("square")
head.color("white")
head.penup()
head.goto(0,0)
head.direction = "stop"

# Snake food
food = turtle.Turtle()
food.speed(0)
food.shape("circle")
food.color("red")
food.penup()
food.goto(0,100)

segments = []

# Pen
pen = turtle.Turtle()
pen.speed(0)
pen.shape("square")
pen.color("white")
pen.penup()
pen.hideturtle()
pen.goto(0, 260)
pen.write("Score: 0  High Score: 0", align="center", font=("Courier", 24, "normal"))
\`\`\``;
  }

  if (
    normalizedInput.includes('table') ||
    normalizedInput.includes('compare') ||
    normalizedInput.includes('markdown') ||
    normalizedInput.includes('fruit')
  ) {
    return `Here is a markdown table comparing different fruits:

| Fruit | Color | Taste | Price |
| :--- | :--- | :--- | :--- |
| **Apple** | Red / Green | Sweet / Tart | $1.20 / lb |
| **Orange** | Orange | Citrusy / Sweet | $0.90 / lb |
| **Banana** | Yellow | Sweet / Creamy | $0.60 / lb |

In Javascript, you can declare a fruit variable like this: \`const fruit = "apple"\`.`;
  }

  const responses = [
    "I'm running in demo mode. Configure a webhook URL to connect to your AI backend.",
    'This is a simulated response. Your message was received instantly.',
    'Demo mode active. Set up your webhook endpoint to see real AI responses.',
    'No webhook configured. Connect your backend to go live.',
  ];

  if (normalizedInput.includes('hello') || normalizedInput.includes('hi')) {
    return 'Connected. Ready. What can I help you build today?';
  }

  if (normalizedInput.includes('webhook')) {
    return 'Configure your webhook URL via the settings icon or the VITE_WEBHOOK_URL env var. Messages are POSTed as JSON; see docs/BACKEND_CONTRACT.md.';
  }

  return responses[Math.floor(Math.random() * responses.length)];
}
