// reports/report.ts
import reporter from 'cucumber-html-reporter';
import path from 'path';

interface ReporterOptions {
  theme: string;
  jsonFile: string;
  output: string;
  reportSuiteAsScenarios?: boolean;
  launchReport?: boolean;
}

const options: any = {
  theme: 'bootstrap',
  jsonFile: path.join(__dirname, 'cucumber-report.json'),
  output: path.join(__dirname, 'report.html'),
  reportSuiteAsScenarios: true,
  launchReport: true,
};

reporter.generate(options);
console.log('✅ HTML report generated at reports/report.html');