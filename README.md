# AISmartBudget 🤖💰

AI-Powered Budget Management & Financial Assistant with intelligent expense tracking, automated insights, and personalized financial guidance.

## Tech Stack

✅ **Frontend:** HTML, CSS, JavaScript (Vanilla - No Frameworks)
✅ **Backend Options:**
  - **Node.js:** Express.js + Google Gemini API
  - **Python:** FastAPI + Google Gemini API
✅ **Database:** JSON file-based (db.json)
✅ **AI:** Google Gemini 2.5 Flash Model

## Features

### 📊 Dashboard
- Real-time income & expense tracking
- Net savings calculation
- Savings rate percentage
- AI-powered financial health report
- Grade-based assessment (A+ to F)

### 💳 Transaction Management
- Add/edit/delete transactions
- Categorize by type (Income, Groceries, Dining, etc.)
- View transaction history with filters
- Quick expense entry

### 💰 Budget Planning
- Generate personalized budget plans
- 50/30/20 rule breakdown
- Multiple budget styles:
  - Balanced (50% needs, 30% wants, 20% savings)
  - Aggressive Savings (45% needs, 20% wants, 35% savings)
  - Flexible Lifestyle (50% needs, 35% wants, 15% savings)

### 🎯 Savings Goals
- Create financial goals with target amounts
- Track progress with visual indicators
- Set deadline dates
- Monitor goal status

### 🤖 AI Financial Assistant
- Chat with SmartBudget AI for financial advice
- Get personalized recommendations
- Ask budget questions
- Receive actionable insights

## Getting Started

### Prerequisites
- Node.js 18+ (for Node backend) OR Python 3.9+ (for Python backend)
- Google Gemini API Key (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/viswa1524/AISmartBudget.git
cd AISmartBudget
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Running with Node.js

1. **Install dependencies**
```bash
npm install
```

2. **Start the server**
```bash
npm run dev     # Development mode
npm start       # Production mode
```

3. **Open in browser**
```
http://localhost:3000
```

### Running with Python

1. **Install dependencies**
```bash
pip install -r requirements.txt
```

2. **Start the server**
```bash
python main.py
```

3. **Open in browser**
```
http://localhost:8000
```

## Project Structure

```
AISmartBudget/
├── public/
│   ├── index.html          # Main HTML page
│   ├── styles.css          # All styling
│   └── script.js           # Vanilla JavaScript logic
├── server.js               # Node.js Express server
├── main.py                 # Python FastAPI server
├── db.json                 # Local database
├── .env.example            # Environment template
├── package.json            # Node dependencies
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## API Endpoints

### Data Management
- `GET /api/health` - Server health check
- `GET /api/data` - Get all data
- `POST /api/data` - Save all data
- `POST /api/transactions` - Add transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/reset-data` - Reset database

### AI Features
- `POST /api/ai/audit` - Generate financial health report
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/parse-expense` - Parse expense text
- `POST /api/ai/generate-budget-plan` - Generate budget plan
- `POST /api/ai/analyze` - Analyze budget (Python)
- `POST /api/ai/parse-receipt` - Parse receipt (Python)
- `POST /api/ai/budget-advice` - Get budget advice (Python)

## Usage Examples

### Add a Transaction
```javascript
const transaction = {
  amount: 50.00,
  description: "Grocery shopping",
  category: "Groceries",
  type: "expense",
  date: "2024-09-29"
};

fetch('/api/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ transaction })
});
```

### Generate Budget Plan
```javascript
fetch('/api/ai/generate-budget-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    monthlyIncome: 5000,
    style: 'balanced'
  })
});
```

### Chat with AI
```javascript
fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "How can I save more money?",
    context: {
      totalIncome: 5000,
      totalExpense: 3500,
      savingsRate: 30
    }
  })
});
```

## Environment Variables

```env
# Google Gemini API
GEMINI_API_KEY=your_api_key_here

# Server
PORT=3000              # For Node.js (default: 3000)
NODE_ENV=development   # development or production
```

Get your free Gemini API key: https://aistudio.google.com/app/apikey

## Features Explained

### Dashboard
- Shows your financial overview at a glance
- Income, expenses, and savings are calculated automatically
- AI-powered health report grades your financial status
- Color-coded display (green for savings, red for expenses)

### Smart Categorization
- Automatic transaction categorization
- Custom category support
- Visual indicators for each category

### AI Assistant
- Powered by Google Gemini 2.5 Flash
- Understands financial context
- Provides personalized recommendations
- Learns from your financial patterns

### Data Persistence
- All data saved locally in db.json
- Automatic sync between frontend and backend
- Easy data export and backup

## Customization

### Change Currency
Edit in `public/script.js`:
```javascript
state.currency = '$'; // Change to '€', '₹', etc.
```

### Modify Categories
Edit the select dropdown in `public/index.html`:
```html
<option value="YourCategory">Your Category</option>
```

### Adjust Budget Ratios
Edit in `public/script.js` or API endpoints:
```javascript
needsRatio = 0.50;      // 50% for needs
wantsRatio = 0.30;      // 30% for wants
savingsRatio = 0.20;    // 20% for savings
```

## Deployment

### Deploy to Vercel (Node.js)
```bash
npm install -g vercel
vercel
```

### Deploy to Railway (Python)
1. Push code to GitHub
2. Connect Railway to GitHub
3. Set environment variables
4. Deploy

### Deploy to Heroku
```bash
heroku create your-app-name
git push heroku main
heroku config:set GEMINI_API_KEY=your_key
```

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Bundle Size:** ~50KB (HTML + CSS + JS)
- **Load Time:** <1s on modern connections
- **AI Response:** 2-5s (depends on Gemini API)
- **No frameworks:** Minimal dependencies

## Troubleshooting

### "GEMINI_API_KEY not found"
- Ensure .env file is in root directory
- Check that API key is valid
- Restart server after adding key

### Transactions not saving
- Check network tab for API errors
- Ensure /api/data endpoint is working
- Check file permissions on db.json

### AI features not working
- Verify Gemini API key is correct
- Check API quota/limits
- Try with a simpler prompt

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - feel free to use for personal or commercial projects

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing issues first
- Provide details: browser, OS, error messages

## Roadmap

- [ ] Multi-user support with authentication
- [ ] CSV/Excel import/export
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and charts
- [ ] Receipt scanning via OCR
- [ ] Recurring transaction templates
- [ ] Savings milestones and achievements
- [ ] Dark/Light theme toggle
- [ ] Multi-language support
- [ ] Bank account integration

---

**Made with ❤️ by the AISmartBudget Team**

Gemini API Documentation: https://ai.google.dev/
