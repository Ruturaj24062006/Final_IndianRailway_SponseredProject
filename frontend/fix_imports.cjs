const fs = require('fs');
const files = [
  'src/PointsmanModule.jsx',
  'src/StationMasterModule.jsx',
  'src/StationSuperintendentModule.jsx',
  'src/TrainManagerModule.jsx',
  'src/TrafficInspectorModule.jsx'
];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf-8');
  c = c.replace(/import\s+[A-Za-z]+MyAssessment\s+from\s+['"].*?MyAssessment['"];/, 'import MyAssessment from \'./components/MyAssessment\';');
  fs.writeFileSync(f, c);
});
console.log('Fixed imports in all modules.');
