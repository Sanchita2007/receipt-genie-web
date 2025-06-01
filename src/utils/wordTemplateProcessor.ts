
import { createReport } from 'docx-templates';

export interface WordTemplateProcessorOptions {
  templateFile: File;
  studentData: any;
  studentName: string;
}

// Function to normalize field names for case-insensitive matching
const normalizeFieldName = (fieldName: string): string => {
  return fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Function to create a mapping object with normalized keys
const createNormalizedDataMapping = (studentData: any): Record<string, any> => {
  const normalizedMapping: Record<string, any> = {};
  
  // Create both original and normalized key mappings
  Object.keys(studentData).forEach(key => {
    const value = studentData[key];
    normalizedMapping[key] = value; // Keep original key
    normalizedMapping[normalizeFieldName(key)] = value; // Add normalized key
    
    // Add common variations
    const lowerKey = key.toLowerCase();
    normalizedMapping[lowerKey] = value;
    normalizedMapping[key.replace(/\s+/g, '').toLowerCase()] = value;
  });

  return normalizedMapping;
};

export const processWordTemplate = async (options: WordTemplateProcessorOptions): Promise<Blob> => {
  const { templateFile, studentData, studentName } = options;
  
  try {
    // Read the template file as ArrayBuffer
    const templateBuffer = await templateFile.arrayBuffer();
    
    // Create normalized data mapping for case-insensitive matching
    const normalizedData = createNormalizedDataMapping(studentData);
    
    console.log('Processing template with data:', normalizedData);
    
    // Process the template with the student data
    const report = await createReport({
      template: templateBuffer,
      data: normalizedData,
      cmdDelimiter: ['{{', '}}'], // Use {{ }} as delimiters
      failFast: false, // Don't fail on missing variables
    });
    
    return new Blob([report], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
  } catch (error) {
    console.error('Error processing Word template:', error);
    throw new Error(`Failed to process Word template: ${error.message}`);
  }
};

export const downloadWordReceipt = (blob: Blob, studentName: string, enrollmentNo: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Receipt_${studentName.replace(/\s+/g, '_')}_${enrollmentNo}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
