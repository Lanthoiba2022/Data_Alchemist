import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Client, Worker, Task } from '../types';

export interface ParseResult<T> {
  data: T[];
  errors: string[];
}

export class FileParser {
  // Parse CSV file
  static async parseCSV<T>(file: File): Promise<ParseResult<T>> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          const errors: string[] = [];
          
          if (results.errors.length > 0) {
            results.errors.forEach((error: any) => {
              errors.push(`Row ${error.row + 1}: ${error.message}`);
            });
          }
          
          resolve({
            data: results.data as T[],
            errors
          });
        },
        error: (error: any) => {
          resolve({
            data: [],
            errors: [`Parse error: ${error.message}`]
          });
        }
      });
    });
  }

  // Parse Excel file
  static async parseExcel<T>(file: File): Promise<ParseResult<T>> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            resolve({
              data: [],
              errors: ['Excel file must have at least a header row and one data row']
            });
            return;
          }
          
          // Convert to objects with headers
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          const dataObjects = rows.map((row, index) => {
            const obj: any = {};
            headers.forEach((header, colIndex) => {
              obj[header] = row[colIndex] || '';
            });
            return obj;
          });
          
          resolve({
            data: dataObjects as T[],
            errors: []
          });
        } catch (error) {
          resolve({
            data: [],
            errors: [`Excel parse error: ${error}`]
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          data: [],
          errors: ['Failed to read Excel file']
        });
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  // Parse Excel file with all sheets
  static async parseExcelMultiSheet(file: File): Promise<{ [sheet: string]: ParseResult<any> }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const result: { [sheet: string]: ParseResult<any> } = {};
          workbook.SheetNames.forEach(sheetName => {
            // Normalize sheet name for matching (e.g., 'Clients 1' -> 'clients')
            const normalized = sheetName.trim().toLowerCase().replace(/\s+\d*$/, '');
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (jsonData.length < 2) {
              result[normalized] = { data: [], errors: ['Sheet must have at least a header row and one data row'] };
              return;
            }
            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1) as any[][];
            const dataObjects = rows.map((row) => {
              const obj: any = {};
              headers.forEach((header, colIndex) => {
                obj[header] = row[colIndex] !== undefined ? row[colIndex] : '';
              });
              return obj;
            });
            result[normalized] = { data: dataObjects, errors: [] };
          });
          resolve(result);
        } catch (error) {
          resolve({ error: { data: [], errors: [`Excel parse error: ${error}`] } });
        }
      };
      reader.onerror = () => {
        resolve({ error: { data: [], errors: ['Failed to read Excel file'] } });
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Parse file based on type
  static async parseFile<T>(file: File): Promise<ParseResult<T>> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      return this.parseCSV<T>(file);
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      return this.parseExcel<T>(file);
    } else {
      return {
        data: [],
        errors: ['Unsupported file type. Please upload CSV or Excel files.']
      };
    }
  }

  // Convert data back to CSV for export
  static exportToCSV<T>(data: T[], filename: string): void {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Export data as JSON
  static exportToJSON(data: any, filename: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}