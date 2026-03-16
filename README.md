# 🔥 Firestore Admin

A premium, glassmorphic web tool designed to simplify writing JSON data to Firestore with a focus on hierarchical organization and state-of-the-art aesthetics.

**[🌐 Live Demo](https://muneebaliarshad.github.io/Firestore_Admin/)**

## ✨ Features

- **Premium Glassmorphic UI**: A high-end dashboard design with deep blur effects, consistent vertical rhythm, and optimized spacing.
- **Data Explorer Explorer**: A comprehensive modal view that lets you visualize your entire Firestore collection as an interactive, recursive tree.
- **Deep Hierarchy Support**: Support for 4-level nesting paths: `Collection > Document > Sub-Collection > Document`.
- **Progressive UI Disclosure**: A guided interface that reveals fields sequentially, reducing cognitive load.
- **Custom Document Naming**: Precise control over document IDs with fallback to JSON-based IDs.
- **Smart Parsing**: Robust handling of standard JSON and Firebase Console configuration snippets.
- **Success Celebration**: Dynamic sparkle animations to provide delightful visual confirmation on saves.

## 🚀 Getting Started

1. **Configure Firebase**:
   - Click the Gear icon ⚙️ in the header.
   - Paste your Firebase Config object.
   - Enter your main collection names.
   - Click **Save & Connect**.

2. **Save Data**:
   - Select a **Main Collection** then choose or create a **Document**.
   - (Optional) Use the **+** toggle for deep sub-collection nesting.
   - Paste your **JSON Data**.
   - Click **Save to Firestore** and watch for the celebration!

3. **Explore Data**:
   - Click the **View Data** button in the header.
   - Drill down into your data hierarchy using the recursive tree nodes.

## 🛠️ Tech Stack

- **Core**: Vanilla HTML5, JavaScript (ES6+).
- **Styles**: Custom Vanilla CSS with a modern spacing system.
- **Backend**: Firebase Firestore v10+.

## 📂 Project Structure

- `index.html`: Optimized semantic layout with modal overlays.
- `style.css`: A comprehensive design system using CSS custom properties.
- `app.js`: Clean, modular logic for Firestore interactions and tree rendering.

---
*Created with ❤️ for high-performance Firestore management.*
