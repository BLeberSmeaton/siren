import jsPDF from 'jspdf';
import Papa from 'papaparse';
import { 
  ReportData, 
  ReportMetrics, 
  CategoryStats,
  ReportPeriod 
} from '../types';

// Report service for generating PDF and CSV reports
export const generateReport = async (reportData: ReportData): Promise<void> => {
  const filteredData = filterDataByDateRange(reportData);
  const metrics = calculateReportMetrics(filteredData);

  switch (reportData.reportConfig.format) {
    case 'pdf':
      await generatePDFReport(filteredData, metrics);
      break;
    case 'csv':
      await generateCSVReport(filteredData, metrics);
      break;
    default:
      throw new Error(`Unsupported report format: ${reportData.reportConfig.format}`);
  }
};

// Filter data based on the report configuration
const filterDataByDateRange = (reportData: ReportData): ReportData => {
  const { startDate, endDate, includeCategories, minimumScore } = reportData.reportConfig;
  
  console.log(`Filtering signals from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log(`Total signals before filtering: ${reportData.signals.length}`);
  console.log(`Category filter:`, includeCategories.length > 0 ? includeCategories : 'All categories');
  console.log(`Minimum score:`, minimumScore || 0);
  
  const filteredSignals = reportData.signals.filter(signal => {
    const signalDate = new Date(signal.timestamp);
    const dateInRange = signalDate >= startDate && signalDate <= endDate;
    
    // Category filtering
    const categoryMatch = includeCategories.length === 0 || 
      includeCategories.includes(signal.category || 'Uncategorized');
    
    // Score filtering
    const scoreMatch = (minimumScore || 0) === 0 || 
      (signal.manualScore !== undefined && signal.manualScore >= (minimumScore || 0));
    
    // Debug logging for first few signals
    if (reportData.signals.indexOf(signal) < 3) {
      console.log(`Signal ${signal.id}: ${signalDate.toISOString()} - Date: ${dateInRange}, Category: ${categoryMatch}, Score: ${scoreMatch}`);
    }
    
    return dateInRange && categoryMatch && scoreMatch;
  });
  
  console.log(`Signals after filtering: ${filteredSignals.length}`);

  // Recalculate category stats for filtered signals
  const categoryMap = new Map<string, { count: number; scores: number[]; latestDate: Date }>();
  
  filteredSignals.forEach(signal => {
    const category = signal.category || 'Uncategorized';
    const existing = categoryMap.get(category) || { count: 0, scores: [], latestDate: new Date(0) };
    
    existing.count++;
    if (signal.manualScore) {
      existing.scores.push(signal.manualScore);
    }
    const signalDate = new Date(signal.timestamp);
    if (signalDate > existing.latestDate) {
      existing.latestDate = signalDate;
    }
    
    categoryMap.set(category, existing);
  });

  const filteredCategoryStats: CategoryStats[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    count: data.count,
    manuallyScored: data.scores.length,
    averageManualScore: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0,
    latestSignal: data.latestDate.toISOString(),
  }));

  return {
    ...reportData,
    signals: filteredSignals,
    categoryStats: filteredCategoryStats,
  };
};

// Calculate comprehensive metrics for the report
const calculateReportMetrics = (reportData: ReportData): ReportMetrics => {
  const { signals, categoryStats } = reportData;
  
  const signalsByCategory = categoryStats.reduce((acc, stat) => {
    acc[stat.category] = stat.count;
    return acc;
  }, {} as { [category: string]: number });

  const scoredSignals = signals.filter(s => s.manualScore !== undefined);
  const averageScore = scoredSignals.length > 0 
    ? scoredSignals.reduce((sum, s) => sum + (s.manualScore || 0), 0) / scoredSignals.length 
    : 0;

  const highPriorityCount = signals.filter(s => (s.manualScore || 0) >= 7).length;

  const topCategories = categoryStats
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(stat => ({
      category: stat.category,
      count: stat.count,
      change: 0, // TODO: Calculate trend vs previous period
    }));

  const criticalSignals = signals
    .filter(s => (s.manualScore || 0) >= 8)
    .sort((a, b) => (b.manualScore || 0) - (a.manualScore || 0))
    .slice(0, 10);

  return {
    totalSignals: signals.length,
    signalsByCategory,
    averageScore,
    highPriorityCount,
    trendsFromPreviousPeriod: {
      signalChange: 0, // TODO: Calculate vs previous period
      scoreChange: 0,
      categoryChanges: {},
    },
    topCategories,
    criticalSignals,
  };
};

// Generate PDF report with executive summary
const generatePDFReport = async (reportData: ReportData, metrics: ReportMetrics): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  let yPosition = 30;
  const lineHeight = 8;
  const margin = 20;
  
  // Add some debugging
  console.log(`Generating PDF for ${metrics.totalSignals} signals, ${Object.keys(metrics.signalsByCategory).length} categories`);

  // Helper function to add page if needed
  const checkPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
    }
  };

  // Helper function to add text with automatic wrapping
  const addText = (text: string, x: number, y: number, maxWidth?: number) => {
    if (maxWidth) {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return lines.length * lineHeight;
    } else {
      pdf.text(text, x, y);
      return lineHeight;
    }
  };

  // Header with logo area
  pdf.setFillColor(0, 102, 204); // Primary blue
  pdf.rect(0, 0, pageWidth, 25, 'F');
  
  // Title and header
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255); // White text
  addText('SIREN Support Insights Report', margin, 18);
  
  // Reset to black text
  pdf.setTextColor(0, 0, 0);
  yPosition = 35;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  addText(`Generated: ${reportData.generatedAt.toLocaleDateString()} at ${reportData.generatedAt.toLocaleTimeString()}`, margin, yPosition);
  yPosition += lineHeight;
  addText(`Period: ${getPeriodDisplayName(reportData.reportConfig.period)}`, margin, yPosition);
  yPosition += lineHeight;
  addText(`Date Range: ${reportData.reportConfig.startDate.toLocaleDateString()} - ${reportData.reportConfig.endDate.toLocaleDateString()}`, margin, yPosition);
  yPosition += lineHeight;
  addText(`Total Signals Analyzed: ${metrics.totalSignals}`, margin, yPosition);
  yPosition += lineHeight * 2;

  // Executive Summary with better styling
  checkPage(lineHeight * 12);
  
  // Section header with background
  pdf.setFillColor(248, 249, 250); // Light gray background
  pdf.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, lineHeight * 2, 'F');
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 102, 204); // Primary blue
  addText('Executive Summary', margin, yPosition + 3);
  pdf.setTextColor(0, 0, 0); // Reset to black
  yPosition += lineHeight * 2.5;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  // Key metrics in a more structured format
  const keyMetrics = [
    { label: 'Total Signals Analyzed', value: metrics.totalSignals.toString(), highlight: true },
    { label: 'Average Priority Score', value: `${metrics.averageScore.toFixed(2)}/10`, highlight: false },
    { label: 'High Priority Signals (≥7)', value: `${metrics.highPriorityCount} (${(metrics.highPriorityCount / (metrics.totalSignals || 1) * 100).toFixed(1)}%)`, highlight: true },
    { label: 'Critical Signals (≥8)', value: metrics.criticalSignals.length.toString(), highlight: metrics.criticalSignals.length > 0 },
    { label: 'Active Categories', value: Object.keys(metrics.signalsByCategory).length.toString(), highlight: false },
  ];

  keyMetrics.forEach(metric => {
    if (metric.highlight) {
      pdf.setFont('helvetica', 'bold');
    }
    addText(`${metric.label}: ${metric.value}`, margin + 5, yPosition);
    pdf.setFont('helvetica', 'normal');
    yPosition += lineHeight + 2;
  });
  yPosition += lineHeight;

  // Top Categories
  checkPage(lineHeight * 10);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  addText('📊 Top Categories', margin, yPosition);
  yPosition += lineHeight * 1.5;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  metrics.topCategories.forEach((cat, index) => {
    const percentage = (cat.count / metrics.totalSignals * 100).toFixed(1);
    addText(`${index + 1}. ${cat.category}: ${cat.count} signals (${percentage}%)`, margin + 5, yPosition);
    yPosition += lineHeight;
  });
  yPosition += lineHeight;

  // Critical Signals
  if (metrics.criticalSignals.length > 0) {
    checkPage(lineHeight * (metrics.criticalSignals.length + 3));
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    addText('🚨 Critical Signals (Score ≥8)', margin, yPosition);
    yPosition += lineHeight * 1.5;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    metrics.criticalSignals.slice(0, 5).forEach((signal, index) => {
      checkPage(lineHeight * 3);
      addText(`${index + 1}. [${signal.manualScore}/10] ${signal.title}`, margin + 5, yPosition);
      yPosition += lineHeight;
      const descHeight = addText(`   ${signal.description.substring(0, 100)}...`, margin + 5, yPosition, pageWidth - 2 * margin - 10);
      yPosition += descHeight;
      addText(`   Source: ${signal.source} | Category: ${signal.category || 'Uncategorized'}`, margin + 5, yPosition);
      yPosition += lineHeight * 1.2;
    });
  }

  // Category Breakdown
  checkPage(lineHeight * 15);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  addText('📈 Category Analysis', margin, yPosition);
  yPosition += lineHeight * 1.5;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  reportData.categoryStats
    .sort((a, b) => b.count - a.count)
    .forEach(stat => {
      checkPage(lineHeight * 3);
      addText(`${stat.category}:`, margin + 5, yPosition);
      yPosition += lineHeight;
      addText(`  • Signals: ${stat.count}`, margin + 10, yPosition);
      yPosition += lineHeight;
      addText(`  • Avg Score: ${stat.averageManualScore.toFixed(2)} (${stat.manuallyScored} scored)`, margin + 10, yPosition);
      yPosition += lineHeight + 2;
    });

  // Team Information (if included)
  if (reportData.reportConfig.includeTeamData && reportData.selectedTeam) {
    checkPage(lineHeight * 8);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    addText(`👥 Team Focus: ${reportData.selectedTeam.displayName}`, margin, yPosition);
    yPosition += lineHeight * 1.5;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    addText(`Description: ${reportData.selectedTeam.description || 'No description available'}`, margin + 5, yPosition);
    yPosition += lineHeight;
    addText(`Active Categories: ${reportData.selectedTeam.categories.filter(c => c.isActive).length}`, margin + 5, yPosition);
    yPosition += lineHeight;
    addText(`Enabled Data Sources: ${reportData.selectedTeam.dataSources.filter(ds => ds.isEnabled).length}`, margin + 5, yPosition);
    yPosition += lineHeight * 2;
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`SIREN Dashboard Report - Page ${i} of ${totalPages}`, pageWidth - margin - 40, pageHeight - 10);
  }

  // Download the PDF
  const filename = `SIREN-Report-${reportData.reportConfig.period}-${reportData.generatedAt.toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
};

// Generate comprehensive CSV report
const generateCSVReport = async (reportData: ReportData, metrics: ReportMetrics): Promise<void> => {
  // Prepare comprehensive signal data
  const csvData = reportData.signals.map(signal => ({
    'Signal ID': signal.id,
    'Title': signal.title,
    'Description': signal.description,
    'Source': signal.source,
    'Category': signal.category || 'Uncategorized',
    'Manual Score': signal.manualScore || '',
    'Timestamp': signal.timestamp,
    'Date': new Date(signal.timestamp).toLocaleDateString(),
    'Time': new Date(signal.timestamp).toLocaleTimeString(),
    'Priority Level': getPriorityLevel(signal.manualScore || 0),
    'Days Ago': Math.floor((Date.now() - new Date(signal.timestamp).getTime()) / (1000 * 60 * 60 * 24)),
  }));

  // Add summary sheet data
  const summaryData = [
    { Metric: 'Total Signals', Value: metrics.totalSignals, Category: 'Overview' },
    { Metric: 'Average Score', Value: metrics.averageScore.toFixed(2), Category: 'Overview' },
    { Metric: 'High Priority Count', Value: metrics.highPriorityCount, Category: 'Overview' },
    { Metric: 'Critical Signals', Value: metrics.criticalSignals.length, Category: 'Overview' },
    { Metric: 'Active Categories', Value: Object.keys(metrics.signalsByCategory).length, Category: 'Overview' },
    ...Object.entries(metrics.signalsByCategory).map(([category, count]) => ({
      Metric: `${category} Count`,
      Value: count,
      Category: 'Category Breakdown'
    }))
  ];

  // Category analysis data
  const categoryAnalysis = reportData.categoryStats.map(stat => ({
    'Category': stat.category,
    'Total Signals': stat.count,
    'Manually Scored': stat.manuallyScored,
    'Average Score': stat.averageManualScore.toFixed(2),
    'Latest Signal': new Date(stat.latestSignal).toLocaleDateString(),
    'Percentage of Total': ((stat.count / metrics.totalSignals) * 100).toFixed(1) + '%'
  }));

  // Since we can't create multiple sheets in CSV, we'll create a comprehensive single CSV
  const allData = [
    '=== SIREN SUPPORT INSIGHTS REPORT ===',
    `Generated: ${reportData.generatedAt.toLocaleString()}`,
    `Period: ${getPeriodDisplayName(reportData.reportConfig.period)}`,
    `Date Range: ${reportData.reportConfig.startDate.toLocaleDateString()} to ${reportData.reportConfig.endDate.toLocaleDateString()}`,
    '',
    '=== EXECUTIVE SUMMARY ===',
    Papa.unparse(summaryData),
    '',
    '=== CATEGORY ANALYSIS ===',
    Papa.unparse(categoryAnalysis),
    '',
    '=== DETAILED SIGNAL DATA ===',
    Papa.unparse(csvData)
  ].join('\n');

  // Download the CSV using our secure utility
  const filename = `SIREN-Report-${reportData.reportConfig.period}-${reportData.generatedAt.toISOString().split('T')[0]}`;
  
  // Create blob with proper MIME type and UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + allData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};

// Helper functions
const getPeriodDisplayName = (period: ReportPeriod): string => {
  switch (period) {
    case 'week': return 'Last 7 days';
    case 'fortnight': return 'Last 14 days';
    case 'month': return 'Last 30 days';
    case 'quarter': return 'Last 90 days';
    case 'all-time': return 'All available data';
    case 'custom': return 'Custom date range';
    default: return 'Unknown period';
  }
};

const getPriorityLevel = (score: number): string => {
  if (score >= 8) return 'Critical';
  if (score >= 6) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
};
