cat > netlify/functions/fetch-events.js << 'EOF'
const TAIWAN_EVENTS = {
  1: [
    { date: '1/1', name: '元旦', type: '國定假日' },
  ],
  2: [
    { date: '2/14', name: '情人節', type: '國際節慶' },
  ],
  9: [
    { date: '9/16', name: '教師節', type: '傳統節慶' },
  ],
  10: [
    { date: '10/10', name: '國慶日', type: '國定假日' },
  ]
};

exports.handler = async (event) => {
  const { month } = JSON.parse(event.body);
  
  const events = TAIWAN_EVENTS[month] || [];
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, events })
  };
};
EOF
