// Mock for SVG imports — react-native-svg-transformer converts .svg files
// into React components, which Jest can't handle without this stub.
const React = require('react');
const SvgMock = (props) => React.createElement('svg', props);
SvgMock.displayName = 'SvgMock';
module.exports = SvgMock;
module.exports.default = SvgMock;
module.exports.ReactComponent = SvgMock;
