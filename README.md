# ⚽ PSG Prediction Market

A modern, Tinder-style prediction market application built for Paris Saint-Germain fans. Users can swipe through PSG-related prediction questions and place bets on various outcomes using Chiliz blockchain.

## 🚀 Features

### 🎯 Core Features
- **Tinder-Style UI**: Swipe left/right to place bets on prediction questions
- **PSG-Themed Design**: Beautiful gradient backgrounds with PSG colors
- **Real-time Betting**: Place bets on match results, player performance, and more
- **Wallet Integration**: Connect with Chiliz blockchain wallets
- **Admin Panel**: Create and manage prediction questions
- **Calm Mode**: Toggle background animations for eye comfort

### 🏆 Prediction Categories
- **Match Results**: Win/Loss/Draw predictions
- **Player Performance**: Goals, assists, cards
- **Season Outcomes**: League titles, UCL progress
- **Transfer News**: Player transfers, coach changes
- **Fan Engagement**: Attendance, social media buzz

### 🎨 UI/UX Features
- **Particle Effects**: Explosion animations on bet placement
- **Responsive Design**: Works on desktop and mobile
- **Glassmorphism**: Modern glass-like UI elements
- **PSG Color Scheme**: Red, blue, and gold gradients
- **Smooth Animations**: Spring-based card interactions

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Spring** - Smooth animations
- **Reown AppKit** - Chiliz blockchain integration

### Backend
- **Supabase** - Database and authentication
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Data protection
- **Storage** - Image uploads and management

### Blockchain
- **Chiliz Network** - Sports-focused blockchain
- **CHZ Token** - Native cryptocurrency for betting

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Chiliz wallet (Reown App)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd chiliz
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Environment Setup**
   Create `.env.local` in the frontend directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
   ```

4. **Database Setup**
   Run the SQL migrations in your Supabase dashboard:
   ```sql
   -- Create questions table
   CREATE TABLE questions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT,
     category TEXT NOT NULL DEFAULT 'match_result',
     image_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
     outcome TEXT CHECK (outcome IN ('yes', 'no', 'draw')),
     total_volume DECIMAL(15,2) DEFAULT 0,
     yes_volume DECIMAL(15,2) DEFAULT 0,
     no_volume DECIMAL(15,2) DEFAULT 0
   );

   -- Add indexes
   CREATE INDEX idx_questions_category ON questions(category);
   CREATE INDEX idx_questions_status ON questions(status);
   CREATE INDEX idx_questions_created_at ON questions(created_at);

   -- Enable RLS
   ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

   -- RLS Policies
   CREATE POLICY "Questions are viewable by everyone" ON questions
     FOR SELECT USING (true);

   CREATE POLICY "Questions can be created by authenticated users" ON questions
     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

   CREATE POLICY "Questions can be updated by authenticated users" ON questions
     FOR UPDATE USING (auth.role() = 'authenticated');
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access the Application**
   - Main App: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## 🎮 Usage

### For Users
1. **Connect Wallet**: Click the wallet button to connect your Chiliz wallet
2. **Set Bet Amount**: Use the amount selector to choose your bet size
3. **Swipe to Bet**: 
   - Swipe right to bet "YES"
   - Swipe left to bet "NO"
   - Tap "PASS" to skip
4. **Watch Animations**: Enjoy particle effects when placing bets

### For Admins
1. **Access Admin Panel**: Navigate to `/admin`
2. **Create Questions**: Use the form to add new prediction questions
3. **Manage Questions**: Edit, delete, or update existing questions
4. **Monitor Activity**: View question statistics and user engagement

## 🏗 Project Structure

```
chiliz/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Main app page
│   │   │   ├── admin/
│   │   │   │   └── page.tsx          # Admin panel
│   │   │   ├── globals.css           # Global styles
│   │   │   └── layout.tsx            # Root layout
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── AddQuestionForm.tsx
│   │   │   │   ├── QuestionList.tsx
│   │   │   │   └── ImageUpload.tsx
│   │   │   └── ui/                   # Reusable UI components
│   │   ├── lib/
│   │   │   ├── admin.ts              # Admin API functions
│   │   │   └── supabase.ts           # Supabase client
│   │   └── types/
│   │       └── supabase.ts           # TypeScript types
│   ├── public/                       # Static assets
│   └── package.json
├── README.md
└── .gitignore
```

## 🔧 Configuration

### Categories
The app supports 20+ PSG-specific prediction categories:
- Match results, player performance, season outcomes
- Transfer news, fan engagement, social metrics
- Each category has custom icons and styling

### Styling
- PSG color palette: Red (#ED1C24), Blue (#004D98), Gold (#C4A484)
- Responsive breakpoints for mobile optimization
- Dark theme with glassmorphism effects

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Paris Saint-Germain** for inspiration
- **Chiliz** for blockchain infrastructure
- **Supabase** for backend services
- **Next.js** team for the amazing framework

## 📞 Support

For support, email support@psg-predictions.com or join our Discord community.

---

**Made with ❤️ for PSG fans worldwide** 