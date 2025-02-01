# StudyGPT - AI-Powered Study Companion for KTU Students

## 🚀 Introduction
StudyGPT is an AI-powered study assistant designed to help KTU students efficiently prepare for exams. By leveraging cutting-edge AI technologies, it processes study materials like syllabus, previous year questions (PYQs), and notes to generate personalized study plans, flashcards, and topic-wise insights.

## 🛠️ Features
- **Personalized Study Plans** – AI-generated schedules based on study materials and available time.
- **Interactive Flashcards** – Memorization made easy with AI-curated key concepts.
- **Repeated PYQs Identification** – Helps focus on frequently asked exam questions.
- **AI Chatbot for Study Assistance** – Modify schedules, get topic explanations, and more.
- **Google Calendar Integration (Upcoming)** – Sync study schedules for easy tracking.
- **Brain-Training Games** – Engage with memory-enhancing activities during study breaks.

## 🏆 Use Cases
1. **Students with full study materials** – Organize syllabus, notes, and PYQs for structured last-minute preparation.
2. **Students in emerging courses** – Computer Science, Business Studies, and VLSI students get AI-generated study plans despite limited resources.
3. **Students under the KTU 2024 scheme** – StudyGPT optimizes study schedules using model question papers and syllabus, even without previous exam resources.

## ⚙️ Tech Stack
- **Frontend** – Next.js, TypeScript
- **Backend** – FastAPI
- **AI & ML** – OpenAI API, Retrieval Augmented Generation (RAG), Faiss, LangChain
- **Database** – Supabase
- **File Processing** – pdfminer
- **Deployment** – Vercel (Frontend), Render (Backend)

## 📌 Future Enhancements
- **Google Calendar Integration** for seamless study tracking.
- **Advanced AI Chatbot** to personalize study schedules and assist with queries.
- **Improved Analytics** to track progress and suggest better study strategies.
- **Collaborative Study Features** for peer-to-peer learning and group study sessions.

## 🔧 Setup Instructions
1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/studygpt.git
   ```
2. Install dependencies:
   ```sh
   cd studygpt
   npm install  # For frontend
   pip install -r requirements.txt  # For backend
   ```
3. Run the application:
   ```sh
   npm run dev  # Start frontend
   uvicorn app.main:app --reload  # Start backend
   ```

## 🤝 Contributing
We welcome contributions! Feel free to submit issues and pull requests to improve StudyGPT.

## 📜 License
MIT License © 2025 Team Bonito Flakes
