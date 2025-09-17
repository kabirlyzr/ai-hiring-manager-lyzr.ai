# AI Hiring Manager - Powered by Lyzr AI

A comprehensive AI-powered hiring management system that streamlines the entire recruitment process from job creation to candidate evaluation using advanced AI agents and modern web technologies.

## 🚀 Overview

The AI Hiring Manager is a Next.js application that leverages multiple AI agents to automate and enhance the hiring process. It provides an intuitive interface for recruiters to create job descriptions, set evaluation criteria, upload candidate resumes, and receive AI-powered evaluations with detailed scoring and feedback.

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **State Management**: Redux Toolkit
- **Database**: Supabase (PostgreSQL)
- **File Storage**: AWS S3
- **AI Services**: Lyzr AI Agents, OpenAI GPT
- **Email**: Nodemailer with SMTP configuration

### Core Components
- **Authentication**: Custom auth provider with Supabase
- **File Management**: PDF processing and S3 storage
- **AI Integration**: Multiple Lyzr AI agents for different tasks
- **Real-time Updates**: Polling-based status updates
- **Responsive Design**: Mobile-first approach

## 🤖 AI Agents Integration

The application uses **4 specialized Lyzr AI agents** to handle different aspects of the hiring process:

### 1. Job Description Generation Agent (`NEXT_PUBLIC_AGENT_CHAT`)
- **Purpose**: Generates comprehensive job descriptions based on basic requirements
- **Input**: Job title, requirements, company context
- **Output**: Detailed job description with responsibilities, qualifications, and benefits
- **Features**: Interactive chat interface for iterative refinement

### 2. Evaluation Criteria Generation Agent (`NEXT_PUBLIC_CRITERIA_AGENT_ID`)
- **Purpose**: Creates evaluation criteria based on job descriptions
- **Input**: Job description, title, and requirements
- **Output**: Weighted evaluation criteria with descriptions
- **Features**: Automatic criteria generation with customizable weights (1-5 scale)

### 3. Candidate Evaluation Agent (`NEXT_PUBLIC_EVALUATION_AGENT_CHAT`)
- **Purpose**: Evaluates candidates against job criteria
- **Input**: Resume text, job description, evaluation criteria
- **Output**: Detailed evaluation with scores and reasoning
- **Features**: Batch processing, PDF text extraction, comprehensive scoring

### 4. RAG (Retrieval Augmented Generation) Agent (`NEXT_PUBLIC_RAG_ID`)
- **Purpose**: Provides contextual knowledge and answers
- **Input**: User queries and context
- **Output**: Relevant information and responses
- **Features**: Knowledge base integration, context-aware responses

## 📋 Application Flow

### 1. Onboarding Process
```
Company Setup → Recruiter Details → SMTP Configuration (Optional)
```

**Company Setup**:
- Company name, industry, size
- Basic company information
- Onboarding completion tracking

**Recruiter Details**:
- Name, email, role, phone
- Professional information
- Contact details for candidate communication

**SMTP Configuration** (Per Recruiter):
- Email server settings
- Authentication credentials
- Test connection functionality

### 2. Job Creation Workflow
```
Job Requirements → AI Job Description → Review & Edit → Save Job
```

**Step 1: Job Requirements**
- Job title input
- Basic requirements description
- Company context integration

**Step 2: AI-Powered Job Description**
- Lyzr agent generates comprehensive job description
- Interactive chat interface for refinement
- Real-time preview and editing

**Step 3: Review & Save**
- Final review of generated content
- Save to database
- Proceed to evaluation criteria

### 3. Evaluation Criteria Setup
```
Job Description → AI Criteria Generation → Customize Weights → Save Criteria
```

**AI Criteria Generation**:
- Automatic criteria generation based on job description
- Weighted scoring system (1-5 scale)
- Detailed descriptions for each criterion

**Customization**:
- Edit generated criteria
- Adjust weights
- Add custom criteria
- Remove irrelevant criteria

### 4. Candidate Evaluation Process
```
Resume Upload → PDF Processing → AI Evaluation → Results & Feedback
```

**Resume Upload**:
- Drag-and-drop interface
- Multiple file support
- File validation and processing

**PDF Processing**:
- Text extraction from PDFs
- Error handling for corrupted files
- Candidate name extraction

**AI Evaluation**:
- Batch processing (10 candidates per batch)
- Parallel evaluation for efficiency
- Comprehensive scoring against criteria

**Results & Feedback**:
- Detailed evaluation reports
- Scoring breakdown by criteria
- Shortlisting recommendations
- Email integration for communication

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- AWS S3 bucket
- OpenAI API key
- Lyzr AI Studio account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-hiring-manager-lyzr.ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your actual credentials (see Environment Variables section)

4. **Database Setup**
   - Create a Supabase project
   - Run the database migrations (if available)
   - Configure RLS policies

5. **AWS S3 Setup**
   - Create an S3 bucket
   - Configure IAM user with S3 permissions
   - Update environment variables

6. **Lyzr AI Setup**
   - Create agents in Lyzr Studio
   - Get agent IDs and API key
   - Configure RAG knowledge base

7. **Start the application**
   ```bash
   npm run dev
   ```

### Environment Variables

See `.env.example` for complete configuration. Key variables:

- **Supabase**: Database and authentication
- **AWS S3**: File storage for resumes
- **OpenAI**: Text processing and JSON formatting
- **Lyzr AI**: Agent IDs and API key
- **RAG**: Knowledge base integration

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── candidates/    # Candidate management
│   │   ├── evaluate/      # AI evaluation endpoint
│   │   ├── jobs/          # Job management
│   │   └── smtp/          # Email configuration
│   ├── jobs/              # Job-related pages
│   ├── onboarding/        # Onboarding flow
│   └── settings/          # Application settings
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── onboarding/        # Onboarding components
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── store/                 # Redux store and slices
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
    ├── supabase/          # Supabase client configuration
    └── LyzrApiCall.ts     # Lyzr AI integration
```

## 🔄 Key Features

### 1. AI-Powered Job Description Generation
- Natural language input for job requirements
- Interactive chat interface for refinement
- Context-aware generation based on company profile

### 2. Intelligent Evaluation Criteria
- Automatic criteria generation
- Weighted scoring system
- Customizable evaluation parameters

### 3. Advanced Candidate Evaluation
- PDF text extraction and processing
- Batch processing for efficiency
- Comprehensive scoring and feedback
- Shortlisting recommendations

### 4. Email Integration
- Per-recruiter SMTP configuration
- Automated candidate communication
- Email templates and scheduling

### 5. Real-time Processing
- Polling-based status updates
- Progress indicators
- Error handling and retry mechanisms

### 6. Responsive Design
- Mobile-first approach
- Modern UI with Radix components
- Dark/light theme support

## 🚀 Deployment

### Production Considerations
- Set all environment variables in your deployment platform
- Configure CORS settings for API endpoints
- Set up proper error monitoring
- Configure CDN for static assets
- Set up database backups

### Recommended Platforms
- Vercel (for Next.js optimization)
- AWS (for full-stack deployment)
- Railway (for easy deployment)
- DigitalOcean (for cost-effective hosting)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the environment configuration
- Ensure all services are properly configured
- Check the console for error messages

## 🔮 Future Enhancements

- Video interview integration
- Advanced analytics dashboard
- Multi-language support
- Integration with popular ATS systems
- Advanced AI model selection
- Real-time collaboration features

---

**Powered by Lyzr AI** - Transforming recruitment with intelligent automation.
