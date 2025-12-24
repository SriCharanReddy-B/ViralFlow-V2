<div align="center">

# 🚀 ViralFlow
### The Autonomous "Pre-Upload" Optimization Agent

**Built by Team ClickBait (GDG-472) for Agentathon**

[![Demo](https://img.shields.io/badge/Live-Demo-indigo?style=for-the-badge&logo=vercel)](https://viral-flow-v2.vercel.app/)
[![Stack](https://img.shields.io/badge/Tech-React_%7C_Vite_%7C_Gemini_2.0-blue?style=for-the-badge)](https://github.com/SriCharanReddy-B/ViralFlow-V2)

</div>

---

## 💡 The Problem: The "Last Mile" Gap
Every day, millions of high-quality videos get **zero views**.
Why? Because creators spend **99%** of their energy on **Editing** and only **1%** on **Packaging** (Thumbnails, Titles, Hooks).

* **The Reality:** A bad thumbnail kills a great video before it even starts.
* **The Cost:** Hiring a YouTube Strategist costs $2,000/month.
* **The Gap:** Most AI tools are just chatbots. They don't "see" the video like a human strategist does.

## 🟢 The Solution: ViralFlow
**ViralFlow** is an autonomous AI Agent that acts as your personal Creative Director. It doesn't just summarize content; it *engineers* virality before you hit upload.

Using **Google's Gemini 2.0 Flash Experimental** (Multimodal), ViralFlow "watches" your raw video file frame-by-frame to understand pacing, emotion, and visual hooks.

### ✨ Key Features
* **👁️ Visual DNA Analysis:** Scans your video to detect mood (e.g., "Chaotic," "Cinematic") and emotional peaks.
* **🎛️ The Vibe Console:** A unique UI where you dictate the creative direction. Want a "Dark Noir" aesthetic? The agent adapts its output instantly.
* **🎨 Viral Bundles:** Generates 4 distinct "Launch Packages" (Thumbnail Concepts + Titles + Hooks) tailored to different viewer psychologies.
* **📈 Retention Map:** Visualizes your video's "Viral Score" timeline, predicting exactly where viewers will drop off.
* **🔒 Client-Side Privacy:** Uses **IndexedDB** to store your analysis history locally in your browser. No database costs, total privacy.

---

## ⚙️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Brain** | **Gemini 2.0 Flash** | Multimodal AI for video & image analysis |
| **Frontend** | **React 19 + Vite** | High-performance reactive UI |
| **Language** | **TypeScript** | Type-safe logic and data models |
| **Styling** | **TailwindCSS** | Modern, responsive design system |
| **Storage** | **IndexedDB** | Local client-side database (Zero backend latency) |
| **Icons** | **Lucide React** | Beautiful, consistent iconography |

---

## 🚀 Getting Started

Follow these steps to run ViralFlow locally on your machine.

### Prerequisites
* Node.js (v18 or higher)
* A Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/SriCharanReddy-B/ViralFlow-V2.git](https://github.com/SriCharanReddy-B/ViralFlow-V2.git)
    cd ViralFlow-V2
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a file named `.env.local` in the root directory and add your API key:
    ```env
    VITE_GEMINI_API_KEY=your_actual_api_key_here
    ```
    *(Note: Ensure your key variable matches the one in your `geminiService.ts` file, typically `VITE_GEMINI_API_KEY` or `GEMINI_API_KEY`)*

4.  **Run the App**
    ```bash
    npm run dev
    ```

5.  **Launch**
    Open your browser and navigate to `http://localhost:5173`.

---



## 👥 Team ClickBait

We are a squad of Full Stack Engineers. We don't believe in silos—every member contributed to every layer of the stack, from the Gemini AI integration to the UI logic.

* **B. Sri Charan Reddy**
* **K. Trishank**
* **S. Harish**
* **A. Ajilesh**

---

<div align="center">

**Built with ❤️ at Agentathon**

</div>
