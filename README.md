<p align=center>
  <img src=https://img.shields.io/badge/node-v10.16.0-brightgreen.svg?style=flat-square alt="node" />
  <img src=https://img.shields.io/badge/npm-v5.6.0-blue.svg?style=flat-square alt="npm" />
  <a href=./LICENSE>
    <img src=https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square alt="License: MIT" />
  </a>
  <a href=./CONTRIBUTING.md>
    <img src=https://img.shields.io/badge/contributions-welcome-orange.svg?style=flat-square alt="Contributions Welcome" />
  </a>
  <a href=https://vercel.com?utm_source=vetswhocode.io&utm_campaign=oss>
    <img src=https://img.shields.io/badge/Powered_by-Vercel-black?style=flat-square alt="Powered by Vercel">
  </a>
</p>

<p align=center>
  <img src=https://avatars1.githubusercontent.com/u/18350560?s=200&v=4 alt="VWC Logo" />
</p>

# Adobe Express Code Playground Toolkit

The Adobe Express Code Playground Toolkit is a comprehensive JavaScript application designed for developer productivity as well as a well thought out app to ease the learning curve of designers and developers learning to contribute to creative coding projects.
By doing this we can teach users with practical use cases, all the while making a professional product that is fast and efficient.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

You will need the following properly installed on your computer.

- [Git](http://git-scm.com/)
- [Node](http://nodejs.org/)
- [NVM](https://github.com/creationix/nvm)
- [Adobe Express](https://express.adobe.com/)

## Installing

In a terminal window run these commands.

```sh
$ git clone https://github.com/your-repo/adobe-express-toolkit.git
$ cd adobe-express-toolkit
$ nvm install
$ npm install
$ npm run dev
```

You should be able to view the toolkit locally at `http://localhost:3000/`.

### How to Use in Adobe Express Code Playground

#### **Quick Start Guide**

1. **Open Adobe Express** → Navigate to **Code Playground**
2. **Copy-paste the toolkit files** directly into the playground:
   - Copy `present_html.html` content into the HTML panel
   - Copy `present_css.css` content into the CSS panel
   - Copy `present_iframe.js` content into the JavaScript panel
   - Copy `present_document.js` content into the Document Sandbox panel

#### **Step-by-Step Usage**

##### **1. Initialize the Toolkit**

- The main dashboard shows **3 toolkit options**
- Click any toolkit to access its features

##### **2. Precision & Consistency Toolkit** 🎯

**Usage Flow:**

1. **Select elements** → Status shows "X elements selected"
2. **Choose alignment** → Click "Align Left/Center/Right"
3. **Apply text effects** → Select text → Choose effect → Preview → Apply
4. **Granular control** → Adjust X/Y position, width/height precisely

##### **3. Content & Project Orchestrator** 📋

**Usage Flow:**

1. **Upload CSV** → Click "Choose File" → Select your data file
2. **Preview data** → Review headers and content
3. **Generate bulk** → Click "Generate Bulk Content"
4. **Organize assets** → Tag elements → Search by tags

##### **4. UI Customizer & Creative Enhancer** 🎨

**Usage Flow:**

1. **Choose pattern** → Click pattern type button
2. **Customize** → Adjust size, colors
3. **Preview** → See live canvas preview
4. **Apply** → "Apply to Selected" or "Create New Element"

#### **Common Use Cases**

##### **Social Media Campaign**

1. Create base design in Express
2. Upload CSV with campaign data (names, dates, colors)
3. Use Bulk Generator → Generate 50+ variations
4. Apply consistent brand colors with Palette Manager
5. Organize with Asset Organizer tags

##### **Brand Consistency Project**

1. Extract colors from brand logo
2. Save as brand palette
3. Create pattern library with brand colors
4. Apply consistent alignment across all elements
5. Save custom filters for brand aesthetic

##### **Rapid Prototyping**

1. Use Test Elements to create layout structure
2. Apply precision alignment for pixel-perfect positioning
3. Generate patterns for backgrounds/textures
4. Create text effects for headlines
5. Export organized asset library

### Add necessary api keys to your new `.env` file.

## Testing

In a terminal window run these commands.

```sh
$ cd adobe-express-toolkit
$ npm run test
```

<br>

In a terminal window run these commands to run the jest test suite in watch mode.

```sh
$ cd adobe-express-toolkit
$ npm run test:watch
```

In a terminal window run these commands to view the jest coverage report.

```sh
$ cd adobe-express-toolkit
$ npm run test:coverage
$ npm run view:coverage
```

In a terminal window run these commands if you need to update a snapshot.

```sh
$ cd adobe-express-toolkit
$ npm run test -- --updateSnapshot
```

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting issues and/or pull requests.

## License

This project is licensed under the MIT License - please see [LICENSE](./LICENSE) for more details.

## Roadmap

Please checkout our [roadmap.md](./roadmap.md) for details of upcoming features.

**Ready to transform your Adobe Express workflow with professional-grade tools!** 🚀
