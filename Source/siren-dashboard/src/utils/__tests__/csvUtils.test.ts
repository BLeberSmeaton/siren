import {
  arrayToCsv,
  downloadCsv,
  csvToArray,
  validateCsvData,
  CsvRow
} from '../csvUtils';

// Mock DOM APIs for testing
const mockCreateElement = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

beforeAll(() => {
  // Mock document.createElement
  Object.defineProperty(document, 'createElement', {
    value: mockCreateElement.mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          setAttribute: jest.fn(),
          style: { visibility: '' },
          click: mockClick,
        };
      }
      return {};
    }),
    configurable: true,
  });

  // Mock document.body methods
  Object.defineProperty(document.body, 'appendChild', {
    value: mockAppendChild,
    configurable: true,
  });

  Object.defineProperty(document.body, 'removeChild', {
    value: mockRemoveChild,
    configurable: true,
  });

  // Mock URL methods
  Object.defineProperty(global.URL, 'createObjectURL', {
    value: mockCreateObjectURL.mockReturnValue('mock-blob-url'),
    configurable: true,
  });

  Object.defineProperty(global.URL, 'revokeObjectURL', {
    value: mockRevokeObjectURL,
    configurable: true,
  });

  // Mock Blob
  global.Blob = jest.fn().mockImplementation((content, options) => ({
    content,
    options,
    size: content.join('').length,
    type: options?.type || '',
  })) as any;
});

beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset the createElement mock for each test
  mockCreateElement.mockImplementation((tagName) => {
    if (tagName === 'a') {
      return {
        setAttribute: jest.fn(),
        style: { visibility: '' },
        click: mockClick,
      };
    }
    return {};
  });
  
  // Reset URL mocks
  mockCreateObjectURL.mockReturnValue('mock-blob-url');
  mockRevokeObjectURL.mockClear();
});

describe('csvUtils', () => {
  describe('arrayToCsv', () => {
    test('converts simple array of objects to CSV', () => {
      const data = [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Los Angeles' },
      ];

      const result = arrayToCsv(data);
      const expected = 'name,age,city\nJohn,30,New York\nJane,25,Los Angeles';
      expect(result).toBe(expected);
    });

    test('handles empty array', () => {
      const result = arrayToCsv([]);
      expect(result).toBe('');
    });

    test('handles null/undefined input', () => {
      expect(arrayToCsv(null as any)).toBe('');
      expect(arrayToCsv(undefined as any)).toBe('');
    });

    test('handles null and undefined values in data', () => {
      const data = [
        { name: 'John', age: null, city: undefined },
        { name: null, age: 25, city: 'Los Angeles' },
      ];

      const result = arrayToCsv(data);
      const expected = 'name,age,city\nJohn,,\n,25,Los Angeles';
      expect(result).toBe(expected);
    });

    test('escapes values containing commas', () => {
      const data = [
        { name: 'John, Jr.', description: 'A person, with a comma' },
      ];

      const result = arrayToCsv(data);
      expect(result).toContain('"John, Jr."');
      expect(result).toContain('"A person, with a comma"');
    });

    test('escapes values containing quotes', () => {
      const data = [
        { quote: 'He said "Hello"', description: 'Contains "quotes"' },
      ];

      const result = arrayToCsv(data);
      expect(result).toContain('"He said ""Hello"""');
      expect(result).toContain('"Contains ""quotes"""');
    });

    test('escapes values containing newlines', () => {
      const data = [
        { text: 'Line 1\nLine 2', description: 'Multi\r\nline text' },
      ];

      const result = arrayToCsv(data);
      expect(result).toContain('"Line 1\nLine 2"');
      expect(result).toContain('"Multi\r\nline text"');
    });

    test('handles custom delimiter', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const result = arrayToCsv(data, { delimiter: ';' });
      const expected = 'name;age\nJohn;30\nJane;25';
      expect(result).toBe(expected);
    });

    test('excludes headers when includeHeaders is false', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const result = arrayToCsv(data, { includeHeaders: false });
      const expected = 'John,30\nJane,25';
      expect(result).toBe(expected);
    });

    test('disables quote escaping when escapeQuotes is false', () => {
      const data = [
        { quote: 'He said "Hello"' },
      ];

      const result = arrayToCsv(data, { escapeQuotes: false });
      expect(result).toContain('"He said "Hello""');
    });

    test('handles boolean values', () => {
      const data = [
        { name: 'John', active: true, admin: false },
      ];

      const result = arrayToCsv(data);
      expect(result).toContain('true');
      expect(result).toContain('false');
    });

    test('handles numeric values', () => {
      const data = [
        { id: 123, price: 45.67, quantity: 0 },
      ];

      const result = arrayToCsv(data);
      expect(result).toContain('123');
      expect(result).toContain('45.67');
      expect(result).toContain('0');
    });

    test('maintains consistent column order across rows', () => {
      const data = [
        { b: 2, a: 1, c: 3 },
        { a: 4, c: 6, b: 5 },
      ];

      const result = arrayToCsv(data);
      const lines = result.split('\n');
      const headers = lines[0].split(',');
      
      // Headers should be taken from first object in consistent order
      expect(headers).toEqual(['b', 'a', 'c']);
      expect(lines[1]).toBe('2,1,3');
      expect(lines[2]).toBe('5,4,6');
    });
  });

  describe('downloadCsv', () => {
    test('creates and triggers download with correct filename', () => {
      const data = [{ name: 'John', age: 30 }];
      const filename = 'test-data';

      downloadCsv(data, filename);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    test('adds .csv extension if not present', () => {
      const data = [{ name: 'John' }];
      const mockSetAttribute = jest.fn();
      
      mockCreateElement.mockReturnValue({
        setAttribute: mockSetAttribute,
        style: { visibility: '' },
        click: mockClick,
      });

      downloadCsv(data, 'test-file');

      expect(mockSetAttribute).toHaveBeenCalledWith('download', 'test-file.csv');
    });

    test('does not add .csv extension if already present', () => {
      const data = [{ name: 'John' }];
      const mockSetAttribute = jest.fn();
      
      mockCreateElement.mockReturnValue({
        setAttribute: mockSetAttribute,
        style: { visibility: '' },
        click: mockClick,
      });

      downloadCsv(data, 'test-file.csv');

      expect(mockSetAttribute).toHaveBeenCalledWith('download', 'test-file.csv');
    });

    test('creates Blob with correct MIME type and BOM', () => {
      const data = [{ name: 'John' }];

      downloadCsv(data, 'test');

      expect(global.Blob).toHaveBeenCalledWith(
        ['\uFEFFname\nJohn'],
        { type: 'text/csv;charset=utf-8;' }
      );
    });

    test('passes options to arrayToCsv', () => {
      const data = [{ name: 'John', age: 30 }];
      const options = { delimiter: ';', includeHeaders: false };

      downloadCsv(data, 'test', options);

      // Verify the CSV content uses the custom options
      expect(global.Blob).toHaveBeenCalledWith(
        ['\uFEFFJohn;30'],
        { type: 'text/csv;charset=utf-8;' }
      );
    });

    test('cleans up resources after download', () => {
      const data = [{ name: 'John' }];

      downloadCsv(data, 'test');

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
      expect(mockRemoveChild).toHaveBeenCalled();
    });
  });

  describe('csvToArray', () => {
    test('parses simple CSV with headers', () => {
      const csvString = 'name,age,city\nJohn,30,New York\nJane,25,Los Angeles';
      const result = csvToArray(csvString);

      expect(result).toEqual([
        { name: 'John', age: '30', city: 'New York' },
        { name: 'Jane', age: '25', city: 'Los Angeles' },
      ]);
    });

    test('handles empty CSV string', () => {
      expect(csvToArray('')).toEqual([]);
      expect(csvToArray('   ')).toEqual([]);
    });

    test('parses CSV without headers', () => {
      const csvString = 'John,30,New York\nJane,25,Los Angeles';
      const result = csvToArray(csvString, { hasHeaders: false });

      expect(result).toEqual([
        { column_1: 'John', column_2: '30', column_3: 'New York' },
        { column_1: 'Jane', column_2: '25', column_3: 'Los Angeles' },
      ]);
    });

    test('handles custom delimiter', () => {
      const csvString = 'name;age;city\nJohn;30;New York\nJane;25;Los Angeles';
      const result = csvToArray(csvString, { delimiter: ';' });

      expect(result).toEqual([
        { name: 'John', age: '30', city: 'New York' },
        { name: 'Jane', age: '25', city: 'Los Angeles' },
      ]);
    });

    test('handles quoted values with commas', () => {
      const csvString = 'name,description\n"John, Jr.","A person with a comma"\nJane,Normal name';
      const result = csvToArray(csvString);

      expect(result).toEqual([
        { name: 'John, Jr.', description: 'A person with a comma' },
        { name: 'Jane', description: 'Normal name' },
      ]);
    });

    test('handles quoted values with escaped quotes', () => {
      const csvString = 'name,quote\nJohn,"He said ""Hello"""\nJane,"She said ""Hi"""';
      const result = csvToArray(csvString);

      expect(result).toEqual([
        { name: 'John', quote: 'He said "Hello"' },
        { name: 'Jane', quote: 'She said "Hi"' },
      ]);
    });

    test('handles empty fields', () => {
      const csvString = 'name,age,city\nJohn,,New York\n,25,Los Angeles';
      const result = csvToArray(csvString);

      expect(result).toEqual([
        { name: 'John', age: '', city: 'New York' },
        { name: '', age: '25', city: 'Los Angeles' },
      ]);
    });

    test('skips empty lines when skipEmptyLines is true', () => {
      const csvString = 'name,age\nJohn,30\n\nJane,25\n\n';
      const result = csvToArray(csvString, { skipEmptyLines: true });

      expect(result).toEqual([
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' },
      ]);
    });

    test('handles Windows line endings', () => {
      const csvString = 'name,age\r\nJohn,30\r\nJane,25';
      const result = csvToArray(csvString);

      expect(result).toEqual([
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' },
      ]);
    });

    test('handles mixed line endings', () => {
      const csvString = 'name,age\nJohn,30\r\nJane,25\rBob,35';
      const result = csvToArray(csvString);

      expect(result).toEqual([
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' },
        { name: 'Bob', age: '35' },
      ]);
    });

    test('handles single row CSV', () => {
      const csvString = 'name,age\nJohn,30';
      const result = csvToArray(csvString);

      expect(result).toEqual([
        { name: 'John', age: '30' },
      ]);
    });

    test('handles headers only CSV', () => {
      const csvString = 'name,age,city';
      const result = csvToArray(csvString);

      expect(result).toEqual([]);
    });
  });

  describe('validateCsvData', () => {
    test('validates correct CSV data structure', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const result = validateCsvData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('rejects non-array input', () => {
      const result = validateCsvData('not an array' as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data must be an array');
    });

    test('rejects empty array', () => {
      const result = validateCsvData([]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data array is empty');
    });

    test('rejects null input', () => {
      const result = validateCsvData(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data must be an array');
    });

    test('rejects undefined input', () => {
      const result = validateCsvData(undefined as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data must be an array');
    });

    test('rejects array with non-object items', () => {
      const data = [
        { name: 'John' },
        'invalid item',
        { name: 'Jane' },
      ];

      const result = validateCsvData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All data items must be objects');
    });

    test('rejects array with null items', () => {
      const data = [
        { name: 'John' },
        null,
        { name: 'Jane' },
      ];

      const result = validateCsvData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All data items must be objects');
    });

    test('rejects array with array items', () => {
      const data = [
        { name: 'John' },
        ['invalid', 'array'],
        { name: 'Jane' },
      ];

      const result = validateCsvData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All data items must be objects');
    });

    test('rejects inconsistent object keys', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', city: 'NYC' }, // Different keys
      ];

      const result = validateCsvData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Inconsistent object keys across data rows');
    });

    test('accepts single item array', () => {
      const data = [{ name: 'John', age: 30 }];

      const result = validateCsvData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('accepts consistent object structure', () => {
      const data = [
        { name: 'John', age: 30, city: 'NYC' },
        { name: 'Jane', age: 25, city: 'LA' },
        { name: 'Bob', age: 35, city: 'Chicago' },
      ];

      const result = validateCsvData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('accepts objects with different key order but same keys', () => {
      const data = [
        { name: 'John', age: 30, city: 'NYC' },
        { age: 25, city: 'LA', name: 'Jane' }, // Different order
      ];

      const result = validateCsvData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('handles objects with null/undefined values', () => {
      const data = [
        { name: 'John', age: null, city: 'NYC' },
        { name: 'Jane', age: undefined, city: 'LA' },
      ];

      const result = validateCsvData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('can return multiple errors', () => {
      const data = ['not an object', null, { invalid: 'structure' }];

      const result = validateCsvData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles extremely large datasets gracefully', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      expect(() => arrayToCsv(largeData)).not.toThrow();
      expect(() => validateCsvData(largeData)).not.toThrow();
    });

    test('handles special characters in CSV', () => {
      const data = [
        { 
          name: 'João', 
          description: 'Special chars: àáâãäåæçèéêë',
          emoji: '🚀📊💻'
        },
      ];

      const result = arrayToCsv(data);
      expect(result).toContain('João');
      expect(result).toContain('àáâãäåæçèéêë');
      expect(result).toContain('🚀📊💻');
    });

    test('handles very long field values', () => {
      const longText = 'A'.repeat(10000);
      const data = [{ id: 1, longField: longText }];

      expect(() => arrayToCsv(data)).not.toThrow();
      const result = arrayToCsv(data);
      expect(result).toContain(longText);
    });

    test('handles objects with many fields', () => {
      const wideObject: CsvRow = {};
      for (let i = 0; i < 100; i++) {
        wideObject[`field${i}`] = `value${i}`;
      }
      const data = [wideObject];

      expect(() => arrayToCsv(data)).not.toThrow();
      expect(() => validateCsvData(data)).not.toThrow();
    });
  });
});
