# Data Alchemist - Excel Data Processing Application

A Next.js application for processing and validating client, worker, and task data from Excel files.

## Features

- **Multi-format Support**: Upload CSV and Excel files (.xlsx, .xls)
- **Data Validation**: Comprehensive validation with detailed error reporting
- **Flexible Data Transformation**: Handles various column name formats
- **Real-time Validation**: Immediate feedback on data quality
- **Export Capabilities**: Export processed data to CSV or JSON

## Excel Data Format

The application expects three types of Excel files with specific column structures:

### Clients Data
Expected columns:
- `ClientID` - Unique client identifier (e.g., "C1", "C2")
- `ClientName` - Client name (e.g., "Acme Corp", "Globex Inc")
- `PriorityLevel` - Priority level 1-5
- `RequestedTaskIDs` - Comma-separated task IDs (e.g., "T1,T2,T3")
- `GroupTag` - Group classification (e.g., "GroupA", "GroupB", "GroupC")
- `AttributesJSON` - JSON string with additional attributes

### Workers Data
Expected columns:
- `WorkerID` - Unique worker identifier (e.g., "W1", "W2")
- `WorkerName` - Worker name (e.g., "Worker1", "Worker2")
- `Skills` - Comma-separated skills (e.g., "data,analysis", "coding,ml")
- `AvailableSlots` - JSON array of available time slots (e.g., "[1,2,3]")
- `MaxLoadPerPh` - Maximum load per phase (integer)
- `WorkerGroup` - Group classification (e.g., "GroupA", "GroupB", "GroupC")
- `QualificationLevel` - Qualification level 1-5

### Tasks Data
Expected columns:
- `TaskID` - Unique task identifier (e.g., "T1", "T2")
- `TaskName` - Task name (e.g., "Data Cleanup", "Report Generation")
- `Category` - Task category (e.g., "ETL", "Analytics", "ML")
- `Duration` - Task duration (integer)
- `RequiredSkills` - Comma-separated required skills
- `PreferredPhase` - JSON array of preferred phases (e.g., "[1,2]", "[2,3,4]")
- `MaxConcurrent` - Maximum concurrent instances (integer)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd data-alchemist
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Uploading Data

1. **Prepare Excel Files**: Ensure your Excel files follow the expected column structure
2. **Upload Files**: Use the upload components for each data type (Clients, Workers, Tasks)
3. **Review Validation**: Check for any validation errors or warnings
4. **Process Data**: Valid data will be automatically processed and stored

### Data Validation

The application performs comprehensive validation:

- **Schema Validation**: Ensures all required fields are present and in correct format
- **Cross-entity Validation**: Validates relationships between clients, workers, and tasks
- **Business Rule Validation**: Checks for logical consistency (e.g., worker skills matching task requirements)

### Export Options

- **CSV Export**: Download processed data as CSV files
- **JSON Export**: Export data in JSON format for further processing

## Technical Details

### File Structure
```
app/
├── components/          # React components
│   ├── DataGrid.tsx    # Data display component
│   ├── FileUpload.tsx  # File upload component
│   └── ValidationSummary.tsx # Validation results
├── context/
│   └── DataContext.tsx # Application state management
├── types/
│   └── index.ts        # TypeScript type definitions
├── utils/
│   ├── fileParser.ts   # File parsing utilities
│   ├── validation.ts   # Data validation logic
│   ├── dataTransformer.ts # Data transformation utilities
│   └── sampleData.ts   # Sample data for testing
```

### Key Technologies

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Material-UI**: UI component library
- **Zod**: Schema validation
- **Papa Parse**: CSV parsing
- **XLSX**: Excel file processing

### Data Processing Flow

1. **File Upload**: User uploads Excel/CSV file
2. **Raw Parsing**: File is parsed into raw data objects
3. **Data Transformation**: Raw data is transformed to application format
4. **Validation**: Data is validated against schemas and business rules
5. **State Update**: Valid data is stored in application state
6. **Error Reporting**: Validation errors are displayed to user

## Development

### Adding New Validation Rules

1. Update the schema in `app/types/index.ts`
2. Add validation logic in `app/utils/validation.ts`
3. Test with sample data

### Extending Data Types

1. Define new types in `app/types/index.ts`
2. Add transformation logic in `app/utils/dataTransformer.ts`
3. Update validation rules
4. Add UI components as needed

### Running Tests

```bash
npm run lint    # Run ESLint
npm run build   # Build for production
```

## Troubleshooting

### Common Issues

1. **File Upload Fails**: Ensure file format is supported (.csv, .xlsx, .xls)
2. **Validation Errors**: Check column names match expected format
3. **Data Not Loading**: Verify Excel file structure matches requirements

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` and check browser console for detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
