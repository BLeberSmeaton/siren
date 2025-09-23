/**
 * Native CSV utility functions to replace PapaParse dependency
 * Provides secure, lightweight CSV generation without external dependencies
 */

export interface CsvRow {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Converts an array of objects to CSV format
 * @param data Array of objects to convert
 * @param options Configuration options
 * @returns CSV string
 */
export function arrayToCsv(
  data: CsvRow[], 
  options: {
    delimiter?: string;
    includeHeaders?: boolean;
    escapeQuotes?: boolean;
  } = {}
): string {
  const {
    delimiter = ',',
    includeHeaders = true,
    escapeQuotes = true
  } = options;

  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Helper function to escape CSV values
  const escapeValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    let stringValue = String(value);
    
    
    // If the value contains delimiter, newlines, or quotes, wrap in quotes
    if (stringValue.includes(delimiter) || 
        stringValue.includes('\n') || 
        stringValue.includes('\r') || 
        stringValue.includes('"')) {
      
      // Escape existing quotes by doubling them
      if (escapeQuotes) {
        stringValue = stringValue.replace(/"/g, '""');
      }
      
      // Wrap in quotes
      stringValue = `"${stringValue}"`;
    }
    
    return stringValue;
  };

  const csvRows: string[] = [];

  // Add headers if requested
  if (includeHeaders) {
    csvRows.push(headers.map(escapeValue).join(delimiter));
  }

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => escapeValue(row[header]));
    csvRows.push(values.join(delimiter));
  });

  return csvRows.join('\n');
}

/**
 * Creates and downloads a CSV file
 * @param data Array of objects to convert to CSV
 * @param filename Name of the file to download
 * @param options CSV generation options
 */
export function downloadCsv(
  data: CsvRow[], 
  filename: string, 
  options?: Parameters<typeof arrayToCsv>[1]
): void {
  const csvContent = arrayToCsv(data, options);
  
  // Create blob with proper MIME type and UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Converts CSV string to array of objects
 * Basic CSV parser for simple use cases
 * @param csvString CSV content as string
 * @param options Parsing options
 * @returns Array of objects
 */
export function csvToArray(
  csvString: string,
  options: {
    delimiter?: string;
    hasHeaders?: boolean;
    skipEmptyLines?: boolean;
  } = {}
): CsvRow[] {
  const {
    delimiter = ',',
    hasHeaders = true,
    skipEmptyLines = true
  } = options;

  if (!csvString.trim()) {
    return [];
  }

  // Simple CSV parsing - handles basic cases
  // For complex CSV with nested quotes, consider using a proper parser
  let lines = csvString.split(/\r\n|\r|\n/);
  
  if (skipEmptyLines) {
    lines = lines.filter(line => line.trim() !== '');
  }

  if (lines.length === 0) {
    return [];
  }

  let headers: string[];
  let dataStartIndex = 0;

  if (hasHeaders) {
    headers = parseCsvLine(lines[0], delimiter);
    dataStartIndex = 1;
  } else {
    // Generate generic headers
    const firstLine = parseCsvLine(lines[0], delimiter);
    headers = firstLine.map((_, index) => `column_${index + 1}`);
  }

  const result: CsvRow[] = [];

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (skipEmptyLines && !line) {
      continue;
    }

    const values = parseCsvLine(line, delimiter);
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    result.push(row);
  }

  return result;
}

/**
 * Parses a single CSV line, handling quoted values
 * @param line CSV line to parse
 * @param delimiter Field delimiter
 * @returns Array of field values
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === delimiter && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
      i++;
    } else {
      // Regular character
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current);

  return result;
}

/**
 * Validates CSV data structure
 * @param data Data to validate
 * @returns Validation result
 */
export function validateCsvData(data: any[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
    return { isValid: false, errors };
  }

  if (data.length === 0) {
    errors.push('Data array is empty');
    return { isValid: false, errors };
  }

  // Check if all items are objects
  const nonObjects = data.filter((item, index) => 
    typeof item !== 'object' || item === null || Array.isArray(item)
  );

  if (nonObjects.length > 0) {
    errors.push('All data items must be objects');
  }

  // Check for consistent headers
  if (data.length > 1) {
    const firstKeys = Object.keys(data[0]).sort();
    const inconsistentRows = data.slice(1).filter((item, index) => {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        return false; // Skip non-objects, they're already handled above
      }
      const keys = Object.keys(item).sort();
      return JSON.stringify(keys) !== JSON.stringify(firstKeys);
    });

    if (inconsistentRows.length > 0) {
      errors.push('Inconsistent object keys across data rows');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
