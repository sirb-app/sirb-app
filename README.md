# Sirb (سرب)

**Sirb** is a learning platform built on two core features: **collaborative learning** and **AI adaptive learning** — helping university students succeed academically.

## What is Sirb?

Sirb is an online platform designed around:

- **Collaborative Learning** — Students create and share educational content with each other. Those who understand a topic can help others learn it too, building a community-driven library of study materials.

- **AI Adaptive Learning** — Through personalized Study Sessions, intelligent algorithms assess your knowledge and adapt the learning experience to your level — generating quizzes, flashcards, and providing an AI chat assistant to help you study smarter.

### The Problem We Solve

Traditional learning often relies on one-size-fits-all materials that may not match what students actually need. Sirb changes this by:

- Letting students create learning materials they wish existed
- Personalizing the learning experience based on each student's knowledge level
- Building a supportive community where advanced students help others
- Making studying more engaging through points and achievements

## Key Features

### For Learners

- **Browse & Enroll** — Find subjects from your university and start learning
- **Rich Learning Content** — Access videos, documents, interactive questions, and more
- **AI-Powered Study Sessions** — Create personalized study sessions that adapt to your knowledge level (more on this below)
- **Progress Tracking** — See how far you've come with your personal dashboard

### For Contributors

- **Create Canvases (lessons)** — Build comprehensive learning modules with text, videos, files, and questions
- **Design Quizzes** — Create quizzes with multiple choice, true/false, and other question types
- **Earn Points** — Get rewarded for creating quality content that helps others
- **Build Reputation** — Gain recognition through community votes on your contributions

### For the Community

- **Discussions** — Comment on content and engage in helpful conversations
- **Quality Control** — Content goes through moderation to ensure accuracy and quality
- **Voting System** — Upvote the best content so others can find it easily

## How It Works

1. **Students create content** — Share your knowledge by creating learning materials
2. **Moderators review** — Quality content gets approved and published
3. **Learners benefit** — Other students use your materials to study and succeed
4. **Everyone grows** — Contributors earn points, learners gain knowledge, and the community thrives

## AI Adaptive Learning

At the heart of Sirb is an intelligent learning system that personalizes your study experience. When you create a **Study Session**, the AI works with you to make learning more effective:

- **Assesses Your Knowledge** — The system evaluates what you already know and identifies gaps in your understanding
- **Generates Tailored Content** — Based on your level, the AI creates quizzes, flashcards, and practice questions just for you
- **Chat Assistant** — Have a conversation with AI to ask questions, get explanations, or dive deeper into topics you're struggling with
- **Tracks Your Mastery** — As you learn, the system remembers what you've mastered and what needs more practice
- **Adapts Over Time** — The more you use it, the smarter it gets about what you need to focus on

This means two students studying the same subject will have completely different experiences based on their individual strengths and weaknesses. No more wasting time on what you already know — focus on what matters most for your success.

_For more technical details about our adaptive learning system, visit the [Study Plan repository](https://github.com/sirb-app/sirb-ai)._

## Our Vision

We believe education works best when students help each other. Sirb transforms learning from a solitary activity into a collaborative journey where every student can be both a learner and a teacher.

---

## Contributors

This project was built with dedication by:

- **Faisal Alkhrayef**
- **Mohammed Alosaimi**
- **Abdulaziz Al Frayan**
- **Salman Alshawmar**

**Supervisor:** Dr. Zeyad Abdullah Alshaikh

---

## Technical Information

For developers interested in the technical details:

### Core Stack

- **Framework:** [Next.js](https://nextjs.org) with App Router for a modern React-based web application
- **Database:** PostgreSQL with Prisma ORM for type-safe database operations
- **Authentication:** Better-auth, email & password and OAuth (Google & GitHub).
- **File Storage:** Cloudflare R2 for storing user-uploaded documents and files

### AI & Adaptive Learning

- Integration with large language models for intelligent quiz generation, knowledge assessment, and conversational learning assistance
- Spaced repetition algorithms for optimized flashcard scheduling

### User Interface

- Component library built on Radix UI for accessible, consistent interactions
- Styled with Tailwind CSS for a clean, responsive design
- Rich text editing powered by TipTap for content creation

### Running Locally

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.
