# Valentine's Memory Game Proposal 💝

A romantic and interactive way to ask your special someone to be your Valentine! This web application features a memory card game in a heart shape, where matching all pairs reveals a special Valentine's proposal with cute animations and effects.

![Demo Preview](public/github-demo.gif)

## Demo 🎮

You can see the live demo of the game [here](https://valentines-proposal-visibait.vercel.app).

## Features ✨

- Interactive memory card game in a heart shape layout
- Beautiful animations and transitions using Framer Motion
- Customizable with your own photos
- Romantic proposal screen with:
  - Fireworks animation on acceptance
  - Playful "No" button that moves away when hovered
  - Cute hamster GIFs and images
- Elegant design with Playfair Display font
- Fully responsive layout
- Built with Next.js and Tailwind CSS

## Prerequisites 📋

- Node.js (v18.18.0 or higher)
- npm or yarn
- Git

## Getting Started 🚀

1. Clone the repository:
```bash
git clone https://github.com/visibait/valentines.git
cd valentines
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Replace the photos:
   - Navigate to the `public/game-photos` directory
   - Replace the existing images (1.avif through 36.avif) with your own photos
   - Make sure to keep the same naming convention
   - Use photos of you and your partner together!

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Customization 🎨

### Changing Photos
- Add your photos to `public/game-photos/`
- Name them from 1.avif to 36.avif
- For best results, use square images of the same size
- Convert your images to .avif format for better performance

### Modifying Text
- Edit proposal messages in `components/ValentinesProposal.tsx`
- Change game instructions in `components/TextFooter.tsx`

### Styling
- The project uses Tailwind CSS for styling
- Modify colors, fonts, and other styles in the respective component files
- Main color schemes can be adjusted in `tailwind.config.js`

## Tech Stack 💻

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Fireworks.js](https://fireworks.js.org/)

## Contributing 🤝

Contributions are welcome! Feel free to submit issues and enhancement requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License.

## Acknowledgments 🙏

- Inspired by love and creativity
- Built with Next.js 15 App Router

## Author ✍️

visibait - [https://visibait.com]

## Donate
[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/visibait)

---

Made with ❤️ for my Valentine

*Note: This project is meant for romantic purposes. Please use responsibly and spread love!*