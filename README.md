🔒 PrivateBox — Local-First File Toolkit
Free, privacy-first image and PDF tools. Your files never leave your device.




Why PrivateBox?
Every time you upload a file to a random online tool, you're trusting a stranger with your documents. Medical records, bank statements, personal photos — you have no idea what happens to them after.
PrivateBox processes everything inside your browser. No uploads. No servers. No accounts. No tracking. Just open the site and use it.

✨ Features
🖼️ Image Tools
Tool	Description
Compress Image	Reduce file size while preserving quality. Batch support.
Resize Image	Change dimensions by pixels. Lock aspect ratio.
Convert Format	Convert between PNG, JPEG, and WEBP. Batch support.
Crop Image	Visual drag-to-crop with rule-of-thirds grid.

📄 PDF Tools
Tool	Description
Merge PDFs	Combine multiple PDFs. Drag to reorder before merging.
Split PDF	Extract page ranges into separate files.
Reorder Pages	Drag page thumbnails to rearrange, then download.
Compress PDF	Remove metadata and compress PDF structure.


🛡️ Privacy First
·	✅ Zero file uploads — processing happens in your browser
·	✅ No analytics or tracking SDKs
·	✅ No account required
·	✅ No cloud storage
·	✅ Works offline (PWA)
·	✅ Open source — verify it yourself

🚀 Live Demo
privatebox.vercel.app

🛠️ Tech Stack
·	React 18 + TypeScript + Vite
·	TailwindCSS — dark, minimal UI
·	pdf-lib — PDF manipulation (pure JS, no server)
·	PDF.js — PDF page rendering
·	browser-image-compression — WASM-powered image compression
·	Zustand — lightweight state management
·	PWA — offline support via service worker

🏃 Run Locally
git clone https://github.com/Mesum1n/privatebox.git
cd privatebox
npm install
npm run dev

Open http://localhost:5173

📦 Deploy Your Own
One-click deploy to Vercel:


🗺️ Roadmap
·	Image → PDF converter
·	PDF → Images
·	Remove image background
·	E-Signature on PDFs
·	ZIP batch download
·	Drag & drop reorder for image batch

📄 License
MIT © Suman Bera

Built with ❤️ by Suman Bera
