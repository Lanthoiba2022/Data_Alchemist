# Data Alchemist - Advanced Data Processing & AI-Powered Validation Platform

A comprehensive Next.js application for processing, validating, and managing client, worker, and task data with advanced AI-powered features and business rule management.

## 🚀 **Core Features**

### **✅ Data Ingestion System**
- **Multi-format Support**: Upload CSV and Excel files (.xlsx, .xls) for clients, workers, and tasks
- **Smart Header Mapping**: AI automatically maps column headers to expected schema
- **Real-time Data Parsing**: Parse uploaded files and display in interactive data grids
- **Inline Editing**: Edit data directly in the grid with immediate validation
- **Real-time Updates**: Changes reflect immediately across the interface

### **✅ Advanced Validation Engine (12/12 Implemented)**
- **Missing Required Columns**: Flag when essential columns are absent
- **Duplicate ID Detection**: Detect duplicate ClientID/WorkerID/TaskID
- **Malformed Data Validation**: Catch non-numeric values in arrays and invalid JSON
- **Range Validation**: Validate PriorityLevel (1-5), Duration (≥1), etc.
- **Cross-Entity Validation**: Ensure RequestedTaskIDs exist in tasks data
- **Circular Dependency Detection**: Detect A→B→C→A circular co-run groups
- **Rule Conflict Detection**: Check rule vs. phase-window constraint conflicts
- **Worker Overload Validation**: Verify AvailableSlots.length ≥ MaxLoadPerPhase
- **Phase-slot Saturation**: Ensure task durations ≤ total worker slots per phase
- **Skill Coverage Matrix**: Every RequiredSkill maps to ≥1 worker
- **Max-concurrency Feasibility**: MaxConcurrent ≤ qualified available workers
- **JSON Structure Validation**: Validate AttributesJSON and other JSON fields

### **✅ AI-Enhanced Features**

#### **Smart Data Processing**
- **AI Header Mapping**: Automatically maps incorrectly named columns to correct schema
- **Flexible Data Recognition**: Handles variations in data format and structure
- **Intelligent Data Transformation**: AI-assisted data cleaning and formatting

#### **Natural Language Data Retrieval**
- **Natural Search**: Search with queries like "All tasks with duration > 1 phase in phase 2"
- **Query Processing**: Parse natural language into data filters
- **Result Display**: Show filtered results based on natural language queries

#### **AI-Enhanced Validation**
- **Intelligent Error Detection**: AI spots patterns that indicate potential issues
- **Contextual Validation**: AI defines broader validations beyond core rules
- **Validation Suggestions**: AI recommends additional validation rules

#### **AI-Powered Error Correction**
- **Auto-Fix Suggestions**: When validation fails, suggest specific fixes
- **One-Click Apply**: Allow users to apply AI suggestions with single click
- **Partial Fix Options**: Apply some suggestions while reviewing others
- **Fix Confidence Scoring**: Show confidence levels for suggested fixes

### **✅ Business Rules Management**

#### **Rule Creation Interface**
- **Co-run Rules**: Select multiple TaskIDs → create co-run rule
- **Slot-restriction Rules**: Choose ClientGroup/WorkerGroup + minCommonSlots
- **Load-limit Rules**: Select WorkerGroup + maxSlotsPerPhase
- **Phase-window Rules**: Pick TaskID + allowed phase list/range
- **Pattern-match Rules**: Enter regex + rule template + parameters
- **Precedence Override**: Define global vs. specific rule priorities
- **Rule Management**: View, edit, delete created rules

#### **AI-Enhanced Rule Creation**
- **Natural Language to Rules**: Accept rules written in plain English
- **Rule Interpretation**: AI converts natural language to structured rules
- **Rule Validation**: AI validates if the rule can be applied to current data
- **Context Understanding**: AI uses data context to understand rule intent

#### **AI Rule Recommendations**
- **Pattern Detection**: AI analyzes data to find common patterns
- **Rule Suggestions**: Pop up suggestions like "Tasks T12 and T14 always run together. Add Co-run rule?"
- **Smart Recommendations**: Context-aware rule suggestions
- **User Feedback Loop**: Learn from accepted/rejected suggestions

### **✅ Prioritization & Weights Interface**
- **Slider-based Weight Assignment**: Assign weights to criteria (PriorityLevel, fairness, etc.)
- **Real-time Weight Adjustment**: Dynamic weight changes with immediate feedback
- **Multiple Criteria Support**: Client Priority, Worker Fairness, Task Urgency, Resource Utilization
- **Visual Weight Display**: Clear visual representation of weight distributions

### **✅ Comprehensive Export Functionality**
- **Clean CSV Export**: Download validated clients.csv, workers.csv, tasks.csv
- **Rules JSON Export**: Download rules.json with all business rules
- **Prioritization Export**: Include weight/priority settings in rules.json
- **Export Validation**: Ensure exported data passes all validations
- **Multiple Format Support**: Export as CSV, JSON, or structured configuration

### **✅ Advanced Validation UI & Feedback**
- **Error Highlighting**: Highlight exact cells/entities with errors
- **Comprehensive Validation Summary**: Display detailed validation report
- **Real-time Validation**: Run validations on file upload AND inline edits
- **Clear Error Messages**: User-friendly error descriptions with AI suggestions
- **Visual Error Indicators**: Color-coded error states and warnings

## 📊 **Data Format Specifications**

### **Clients Data**
Expected columns:
- `ClientID` - Unique client identifier (e.g., "C1", "C2")
- `ClientName` - Client name (e.g., "Acme Corp", "Globex Inc")
- `PriorityLevel` - Priority level 1-5
- `RequestedTaskIDs` - Comma-separated task IDs (e.g., "T1,T2,T3")
- `GroupTag` - Group classification (e.g., "GroupA", "GroupB", "GroupC")
- `AttributesJSON` - JSON string with additional attributes

### **Workers Data**
Expected columns:
- `WorkerID` - Unique worker identifier (e.g., "W1", "W2")
- `WorkerName` - Worker name (e.g., "Worker1", "Worker2")
- `Skills` - Comma-separated skills (e.g., "data,analysis", "coding,ml")
- `AvailableSlots` - JSON array of available time slots (e.g., "[1,2,3]")
- `MaxLoadPerPh` - Maximum load per phase (integer)
- `WorkerGroup` - Group classification (e.g., "GroupA", "GroupB", "GroupC")
- `QualificationLevel` - Qualification level 1-5

### **Tasks Data**
Expected columns:
- `TaskID` - Unique task identifier (e.g., "T1", "T2")
- `TaskName` - Task name (e.g., "Data Cleanup", "Report Generation")
- `Category` - Task category (e.g., "ETL", "Analytics", "ML")
- `Duration` - Task duration (integer)
- `RequiredSkills` - Comma-separated required skills
- `PreferredPhase` - JSON array of preferred phases (e.g., "[1,2]", "[2,3,4]")
- `MaxConcurrent` - Maximum concurrent instances (integer)

## 🛠️ **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- OpenAI API key (optional, for AI features)

### **Installation**

1. **Clone the repository**:
```bash
git clone <repository-url>
cd data-alchemist
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables** (optional, for AI features):
```bash
# Create .env.local file
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Start the development server**:
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## 🎯 **Usage Guide**

### **1. Data Upload & Processing**
1. **Prepare Excel Files**: Ensure your Excel files follow the expected column structure
2. **Upload Files**: Use the upload components for each data type (Clients, Workers, Tasks)
3. **AI Header Mapping**: The system automatically maps column headers to the correct schema
4. **Review Validation**: Check for any validation errors or warnings with AI suggestions
5. **Process Data**: Valid data is automatically processed and stored

### **2. Data Validation & AI Assistance**
- **Real-time Validation**: All data is validated immediately upon upload
- **AI Error Correction**: Click on validation errors to get AI-suggested fixes
- **One-click Apply**: Apply AI suggestions with a single click
- **Manual Editing**: Edit data directly in the grid with live validation

### **3. Business Rules Management**
- **Create Rules**: Use the Rule Builder to create various types of business rules
- **AI Rule Generation**: Describe rules in natural language and let AI convert them
- **Rule Suggestions**: Get AI-powered suggestions for useful business rules
- **Rule Management**: View, edit, and delete rules as needed

### **4. Natural Language Search**
- **Query Data**: Use natural language to search your data
- **Examples**: "All tasks with duration > 1", "Workers with data skills", "High priority clients"
- **Filter Results**: Get filtered results based on your natural language queries

### **5. Prioritization & Export**
- **Set Weights**: Adjust priority weights using the slider interface
- **Export Data**: Download clean CSV files with validated data
- **Export Rules**: Download complete rules configuration as JSON
- **Export Everything**: Get a complete export with data, rules, and settings

## 🏗️ **Technical Architecture**

### **File Structure**
```
app/
├── api/                    # API routes
│   ├── ai-header-map/     # AI header mapping
│   ├── ai-suggest-fix/    # AI error correction
│   ├── nl-search/         # Natural language search
│   ├── nl-rule/           # Natural language rule creation
│   └── suggest-rules/     # AI rule suggestions
├── components/            # React components
│   ├── DataGrid.tsx      # Interactive data display
│   ├── FileUpload.tsx    # File upload with AI mapping
│   ├── RuleBuilder.tsx   # Business rule creation
│   ├── PriorityWeights.tsx # Weight management
│   ├── ExportPanel.tsx   # Export functionality
│   └── ValidationSummary.tsx # Validation results
├── context/
│   └── DataContext.tsx   # Application state management
├── types/
│   └── index.ts          # TypeScript type definitions
└── utils/
    ├── fileParser.ts     # File parsing utilities
    ├── validation.ts     # Data validation logic
    ├── dataTransformer.ts # Data transformation utilities
    └── excelTemplate.ts  # Excel template generation
```

### **Key Technologies**
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Material-UI**: Modern UI component library
- **Zod**: Schema validation
- **OpenAI API**: AI-powered features
- **Papa Parse**: CSV parsing
- **XLSX**: Excel file processing

### **AI Integration**
- **OpenAI GPT-4**: Natural language processing
- **Smart Header Mapping**: Automatic column recognition
- **Error Correction**: AI-powered data fixing
- **Rule Generation**: Natural language to structured rules
- **Search Enhancement**: Natural language data queries

## 🔧 **Development**

### **Adding New Validation Rules**
1. Update the schema in `app/types/index.ts`
2. Add validation logic in `app/utils/validation.ts`
3. Test with sample data

### **Extending AI Features**
1. Add new API routes in `app/api/`
2. Update components to use new AI endpoints
3. Test with various data scenarios

### **Running Tests**
```bash
npm run lint    # Run ESLint
npm run build   # Build for production
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **File Upload Fails**: 
   - Ensure file format is supported (.csv, .xlsx, .xls)
   - Check file size limits
   - Verify column headers match expected format

2. **AI Features Not Working**:
   - Verify OpenAI API key is set in environment variables
   - Check API key permissions and quota
   - Features will fall back to basic functionality if AI is unavailable

3. **Validation Errors**:
   - Check column names match expected format
   - Verify data types (numbers, arrays, JSON)
   - Use AI suggestions to fix common issues

4. **Export Issues**:
   - Ensure data passes all validations before export
   - Check browser download permissions
   - Verify file naming conventions

### **Debug Mode**
Enable debug logging by setting `NODE_ENV=development` and check browser console for detailed error messages.

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

---

## 🎉 **Feature Completion Status**

### **✅ Mandatory Goals (100% Complete)**
- [✓] **Goal 1**: Data Ingestion System
- [✓] **Goal 2**: Core Validation Engine (12/12 implemented)
- [✓] **Goal 3**: Validation UI & Feedback
- [✓] **Goal 4**: Business Rules Creation UI
- [✓] **Goal 5**: Rules JSON Generation
- [✓] **Goal 6**: Prioritization & Weights Interface
- [✓] **Goal 7**: E✓port Functionality
- [✓] **Goal 8**: Technical Implementation
- [✓] **Goal 9**: Documentation & Deployment

### **✅ Optional AI Enhancement Goals (100% Complete)**
- [✓] **Goal 10**: AI-Enhanced Data Parsing
- [✓] **Goal 11**: Natural Language Data Retrieval
- [✓] **Goal 12**: AI-Enhanced Validation
- [✓] **Goal 13**: Natural Language to Rules Converter
- [✓] **Goal 14**: AI Rule Recommendations
- [✓] **Goal 15**: Natural Language Data Modification
- [✓] **Goal 16**: AI-Powered Error Correction
- [✓] **Goal 17**: Advanced AI Features

**All planned features have been successfully implemented! 🚀**
