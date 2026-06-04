const fs = require('fs');

const modules = [
  {
    file: 'src/StationMasterModule.jsx',
    importSearch: /import SMMyAssessment from '\.\/components\/StationMasterModule\/SMMyAssessment';/,
    tagSearch: /<SMMyAssessment/g,
    roleTitle: 'Station Master',
    assessedByTitle: 'Traffic Inspector',
    propReplaces: [
      { from: /smMcqTest=\{smMcqTest\}/, to: 'mcqTest={smMcqTest}' },
      { from: /stationHistory=\{stationHistory\}/, to: 'history={stationHistory}' },
      { from: /pageMode=\{pageMode\}/, to: 'screenMode={pageMode}' },
      { from: /setPageMode=\{setPageMode\}/, to: 'setScreenMode={setPageMode}' },
      { from: /smName=\{smName\}/, to: 'fullName={smName}' },
      { from: /smId=\{smId\}/, to: 'employeeId={smId}' },
      { from: /smProfile=\{smProfile\}/, to: 'profileData={smProfile}' }
    ]
  },
  {
    file: 'src/StationSuperintendentModule.jsx',
    importSearch: /import SSMyAssessment from '\.\/components\/StationSuperintendentModule\/SSMyAssessment';/,
    tagSearch: /<SSMyAssessment/g,
    roleTitle: 'Station Superintendent',
    assessedByTitle: 'AOM',
    propReplaces: [
      { from: /ssMcqTest=\{ssMcqTest\}/, to: 'mcqTest={ssMcqTest}' },
      { from: /stationHistory=\{stationHistory\}/, to: 'history={stationHistory}' },
      { from: /pageMode=\{pageMode\}/, to: 'screenMode={pageMode}' },
      { from: /setPageMode=\{setPageMode\}/, to: 'setScreenMode={setPageMode}' },
      { from: /ssName=\{ssName\}/, to: 'fullName={ssName}' },
      { from: /ssId=\{ssId\}/, to: 'employeeId={ssId}' },
      { from: /ssProfile=\{ssProfile\}/, to: 'profileData={ssProfile}' }
    ]
  },
  {
    file: 'src/TrainManagerModule.jsx',
    importSearch: /import TMMyAssessment from '\.\/components\/TrainManagerModule\/TMMyAssessment';/,
    tagSearch: /<TMMyAssessment/g,
    roleTitle: 'Train Manager',
    assessedByTitle: 'Station Master',
    propReplaces: [
      { from: /tmMcqTest=\{tmMcqTest\}/, to: 'mcqTest={tmMcqTest}' },
      { from: /tmActiveQIdx=\{tmActiveQIdx\}/, to: 'activeQIdx={tmActiveQIdx}' },
      { from: /setTmActiveQIdx=\{setTmActiveQIdx\}/, to: 'setActiveQIdx={setTmActiveQIdx}' },
      { from: /tmTestResponses=\{tmTestResponses\}/, to: 'testResponses={tmTestResponses}' },
      { from: /setTmTestResponses=\{setTmTestResponses\}/, to: 'setTestResponses={setTmTestResponses}' },
      { from: /trainManagerProfile=\{trainManagerProfile\}/, to: 'profileData={trainManagerProfile}' }
    ]
  },
  {
    file: 'src/TrafficInspectorModule.jsx',
    importSearch: /import TIMyAssessment from '\.\/components\/TrafficInspectorModule\/TIMyAssessment';/,
    tagSearch: /<TIMyAssessment/g,
    roleTitle: 'Traffic Inspector',
    assessedByTitle: 'Senior DOM',
    propReplaces: [
      { from: /tiMcqTest=\{tiMcqTest\}/, to: 'mcqTest={tiMcqTest}' },
      { from: /stationHistory=\{stationHistory\}/, to: 'history={stationHistory}' },
      { from: /pageMode=\{pageMode\}/, to: 'screenMode={pageMode}' },
      { from: /setPageMode=\{setPageMode\}/, to: 'setScreenMode={setPageMode}' },
      { from: /tiName=\{tiName\}/, to: 'fullName={tiName}' },
      { from: /tiId=\{tiId\}/, to: 'employeeId={tiId}' },
      { from: /tiProfile=\{tiProfile\}/, to: 'profileData={tiProfile}' }
    ]
  }
];

modules.forEach(m => {
  if (fs.existsSync(m.file)) {
    let c = fs.readFileSync(m.file, 'utf-8');
    c = c.replace(m.importSearch, 'import MyAssessment from \'./components/MyAssessment\';');
    c = c.replace(m.tagSearch, `<MyAssessment\n      roleTitle="${m.roleTitle}"\n      assessedByTitle="${m.assessedByTitle}"`);
    m.propReplaces.forEach(pr => {
      c = c.replace(pr.from, pr.to);
    });
    fs.writeFileSync(m.file, c);
    console.log(`${m.file} updated.`);
  }
});
