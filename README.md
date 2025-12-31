# Movement - Civic Engagement Platform

<p align="center">
  <img src="https://shakespeare.diy/badge.svg" alt="Edit with Shakespeare" />
</p>

<p align="center">
  <strong>A decentralized civic engagement platform combining Change.org-style campaigns with Democracy.io-style representative contact.</strong>
</p>

<p align="center">
  Built on Nostr for censorship-resistant campaigns and social proof, with Cashu integration for anti-spam protection.
</p>

---

## ✨ Features

### Campaign Discovery
- **Trending Campaigns** - Most popular campaigns based on engagement
- **Hot Campaigns** - Most actions in the last 24 hours
- **New Campaigns** - Recently created campaigns
- Category-based filtering and search
- Social proof displays (action counts, shares, reactions)

### Take Action Flow
1. **Identify Yourself** - Enter your ZIP code to find your representatives
2. **Review Representatives** - See which officials will receive your message
3. **Draft Message** - Use or customize the campaign's message template
4. **Send** - Contact all relevant representatives with one click
5. **Share** - Generate a "Proof of Action" attestation on Nostr

### Campaign Creation
- Multi-step wizard for easy campaign creation
- 15 civic categories (Environment, Healthcare, Education, etc.)
- Target multiple government levels (Federal, State, Local)
- Message template builder for supporter actions
- Optional anti-spam stake (Cashu)

### Nostr Integration
- **Campaign Events (Kind 31100)** - Decentralized campaign storage
- **Action Attestations (Kind 31102)** - Social proof of participation
- **Campaign Updates (Kind 31101)** - Status changes and milestones
- **Standard Nostr Events** - Reactions, reposts, comments

### Cashu Integration
- **Anti-Spam Stakes** - Small refundable deposits to prevent abuse
- **Optional Donations** - Support platform infrastructure
- **Creator Tips** - Direct support for campaign organizers

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Nostr extension (nsecbunker, nos2x, etc.) for full features

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/movement.git
cd movement

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

---

## 🏗️ Architecture

```
Movement/
├── src/
│   ├── components/     # React components (shadcn/ui based)
│   ├── pages/          # Route pages (Index, CampaignDetail, CreateCampaign)
│   ├── hooks/          # Custom React hooks (useCampaign, useCampaignPublish)
│   ├── types/          # TypeScript type definitions
│   ├── lib/            # Utility functions and sample data
│   └── App.tsx         # App provider setup
├── skills/             # Implementation guides (Cashu, Lightning, etc.)
├── MOVEMENT_BUILD_PLAN.md  # Technical specification
└── NIP.md              # Nostr event schema documentation
```

### Technology Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS 3.x** - Styling
- **Vite** - Build tool
- **Nostrify** - Nostr protocol integration
- **TanStack Query** - Data fetching and caching
- **Framer Motion** - Animations
- **Cashu** - Token-based anti-spam

---

## 📖 Documentation

### Build Plan
See [MOVEMENT_BUILD_PLAN.md](MOVEMENT_BUILD_PLAN.md) for:
- Complete architecture overview
- Data flow diagrams
- UX flow specifications
- Implementation roadmap

### Nostr Protocol
See [NIP.md](NIP.md) for:
- Custom event kind definitions
- Event schemas and tags
- Security and privacy guidelines
- Query examples

### Skills
The `skills/` directory contains implementation guides for:
- `cashu-wallet` - Cashu token operations
- `exchange-rates` - BTC/fiat conversion
- `qr-code-generator` - QR code generation
- And more...

---

## 🎯 Nostr Event Kinds

| Kind | Name | Description |
|------|------|-------------|
| 31100 | Campaign | Campaign creation (addressable) |
| 31101 | Campaign Update | Status changes (addressable) |
| 31102 | Action Attestation | Proof of action taken |
| 1 | Comment | Campaign comments |
| 6 | Repost | Share campaigns |
| 7 | Reaction | Support reactions |

---

## 🔒 Privacy & Security

- **No Address Storage** - User locations are stored locally, never on Nostr
- **Proof of Action Only** - Attestations prove participation without revealing message content
- **Anti-Abuse** - Cashu stakes prevent spam without collecting personal data
- **Censorship Resistant** - Campaigns live on decentralized relays

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [MKStack](https://gitlab.com/soapbox-pub/mkstack) - Base template with Nostr integration
- [Nostr Protocol](https://nostr.com) - Decentralized social layer
- [Cashu](https://cashu.space) - Token-based privacy
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components

---

<p align="center">
  Made with ❤️ for civic engagement
</p>

<p align="center">
  <a href="https://shakespeare.diy">Built with Shakespeare</a>
</p>
