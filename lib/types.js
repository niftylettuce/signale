"use strict";

var figures = require('figures');

module.exports = {
  error: {
    badge: figures.cross,
    color: 'red',
    label: 'error'
  },
  fatal: {
    badge: figures.cross,
    color: 'red',
    label: 'fatal'
  },
  fav: {
    badge: figures('❤'),
    color: 'magenta',
    label: 'favorite'
  },
  info: {
    badge: figures.info,
    color: 'blue',
    label: 'info'
  },
  star: {
    badge: figures.star,
    color: 'yellow',
    label: 'star'
  },
  success: {
    badge: figures.tick,
    color: 'green',
    label: 'success'
  },
  warn: {
    badge: figures.warning,
    color: 'yellow',
    label: 'warning'
  },
  complete: {
    badge: figures.checkboxOn,
    color: 'cyan',
    label: 'complete'
  },
  pending: {
    badge: figures.checkboxOff,
    color: 'magenta',
    label: 'pending'
  },
  note: {
    badge: figures.bullet,
    color: 'blue',
    label: 'note'
  },
  start: {
    badge: figures.play,
    color: 'green',
    label: 'start'
  },
  pause: {
    badge: figures.squareSmallFilled,
    color: 'yellow',
    label: 'pause'
  },
  debug: {
    badge: figures('⬤'),
    color: 'red',
    label: 'debug'
  },
  await: {
    badge: figures.ellipsis,
    color: 'blue',
    label: 'awaiting'
  },
  watch: {
    badge: figures.ellipsis,
    color: 'yellow',
    label: 'watching'
  },
  log: {
    badge: '',
    color: '',
    label: ''
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90eXBlcy5qcyJdLCJuYW1lcyI6WyJmaWd1cmVzIiwicmVxdWlyZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJlcnJvciIsImJhZGdlIiwiY3Jvc3MiLCJjb2xvciIsImxhYmVsIiwiZmF0YWwiLCJmYXYiLCJpbmZvIiwic3RhciIsInN1Y2Nlc3MiLCJ0aWNrIiwid2FybiIsIndhcm5pbmciLCJjb21wbGV0ZSIsImNoZWNrYm94T24iLCJwZW5kaW5nIiwiY2hlY2tib3hPZmYiLCJub3RlIiwiYnVsbGV0Iiwic3RhcnQiLCJwbGF5IiwicGF1c2UiLCJzcXVhcmVTbWFsbEZpbGxlZCIsImRlYnVnIiwiYXdhaXQiLCJlbGxpcHNpcyIsIndhdGNoIiwibG9nIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQU1BLFVBQVVDLFFBQVEsU0FBUixDQUFoQjs7QUFFQUMsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxTQUFPO0FBQ0xDLFdBQU9MLFFBQVFNLEtBRFY7QUFFTEMsV0FBTyxLQUZGO0FBR0xDLFdBQU87QUFIRixHQURRO0FBTWZDLFNBQU87QUFDTEosV0FBT0wsUUFBUU0sS0FEVjtBQUVMQyxXQUFPLEtBRkY7QUFHTEMsV0FBTztBQUhGLEdBTlE7QUFXZkUsT0FBSztBQUNITCxXQUFPTCxRQUFRLEdBQVIsQ0FESjtBQUVITyxXQUFPLFNBRko7QUFHSEMsV0FBTztBQUhKLEdBWFU7QUFnQmZHLFFBQU07QUFDSk4sV0FBT0wsUUFBUVcsSUFEWDtBQUVKSixXQUFPLE1BRkg7QUFHSkMsV0FBTztBQUhILEdBaEJTO0FBcUJmSSxRQUFNO0FBQ0pQLFdBQU9MLFFBQVFZLElBRFg7QUFFSkwsV0FBTyxRQUZIO0FBR0pDLFdBQU87QUFISCxHQXJCUztBQTBCZkssV0FBUztBQUNQUixXQUFPTCxRQUFRYyxJQURSO0FBRVBQLFdBQU8sT0FGQTtBQUdQQyxXQUFPO0FBSEEsR0ExQk07QUErQmZPLFFBQU07QUFDSlYsV0FBT0wsUUFBUWdCLE9BRFg7QUFFSlQsV0FBTyxRQUZIO0FBR0pDLFdBQU87QUFISCxHQS9CUztBQW9DZlMsWUFBVTtBQUNSWixXQUFPTCxRQUFRa0IsVUFEUDtBQUVSWCxXQUFPLE1BRkM7QUFHUkMsV0FBTztBQUhDLEdBcENLO0FBeUNmVyxXQUFTO0FBQ1BkLFdBQU9MLFFBQVFvQixXQURSO0FBRVBiLFdBQU8sU0FGQTtBQUdQQyxXQUFPO0FBSEEsR0F6Q007QUE4Q2ZhLFFBQU07QUFDSmhCLFdBQU9MLFFBQVFzQixNQURYO0FBRUpmLFdBQU8sTUFGSDtBQUdKQyxXQUFPO0FBSEgsR0E5Q1M7QUFtRGZlLFNBQU87QUFDTGxCLFdBQU9MLFFBQVF3QixJQURWO0FBRUxqQixXQUFPLE9BRkY7QUFHTEMsV0FBTztBQUhGLEdBbkRRO0FBd0RmaUIsU0FBTztBQUNMcEIsV0FBT0wsUUFBUTBCLGlCQURWO0FBRUxuQixXQUFPLFFBRkY7QUFHTEMsV0FBTztBQUhGLEdBeERRO0FBNkRmbUIsU0FBTztBQUNMdEIsV0FBT0wsUUFBUSxHQUFSLENBREY7QUFFTE8sV0FBTyxLQUZGO0FBR0xDLFdBQU87QUFIRixHQTdEUTtBQWtFZm9CLFNBQU87QUFDTHZCLFdBQU9MLFFBQVE2QixRQURWO0FBRUx0QixXQUFPLE1BRkY7QUFHTEMsV0FBTztBQUhGLEdBbEVRO0FBdUVmc0IsU0FBTztBQUNMekIsV0FBT0wsUUFBUTZCLFFBRFY7QUFFTHRCLFdBQU8sUUFGRjtBQUdMQyxXQUFPO0FBSEYsR0F2RVE7QUE0RWZ1QixPQUFLO0FBQ0gxQixXQUFPLEVBREo7QUFFSEUsV0FBTyxFQUZKO0FBR0hDLFdBQU87QUFISjtBQTVFVSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGZpZ3VyZXMgPSByZXF1aXJlKCdmaWd1cmVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBlcnJvcjoge1xuICAgIGJhZGdlOiBmaWd1cmVzLmNyb3NzLFxuICAgIGNvbG9yOiAncmVkJyxcbiAgICBsYWJlbDogJ2Vycm9yJ1xuICB9LFxuICBmYXRhbDoge1xuICAgIGJhZGdlOiBmaWd1cmVzLmNyb3NzLFxuICAgIGNvbG9yOiAncmVkJyxcbiAgICBsYWJlbDogJ2ZhdGFsJ1xuICB9LFxuICBmYXY6IHtcbiAgICBiYWRnZTogZmlndXJlcygn4p2kJyksXG4gICAgY29sb3I6ICdtYWdlbnRhJyxcbiAgICBsYWJlbDogJ2Zhdm9yaXRlJ1xuICB9LFxuICBpbmZvOiB7XG4gICAgYmFkZ2U6IGZpZ3VyZXMuaW5mbyxcbiAgICBjb2xvcjogJ2JsdWUnLFxuICAgIGxhYmVsOiAnaW5mbydcbiAgfSxcbiAgc3Rhcjoge1xuICAgIGJhZGdlOiBmaWd1cmVzLnN0YXIsXG4gICAgY29sb3I6ICd5ZWxsb3cnLFxuICAgIGxhYmVsOiAnc3RhcidcbiAgfSxcbiAgc3VjY2Vzczoge1xuICAgIGJhZGdlOiBmaWd1cmVzLnRpY2ssXG4gICAgY29sb3I6ICdncmVlbicsXG4gICAgbGFiZWw6ICdzdWNjZXNzJ1xuICB9LFxuICB3YXJuOiB7XG4gICAgYmFkZ2U6IGZpZ3VyZXMud2FybmluZyxcbiAgICBjb2xvcjogJ3llbGxvdycsXG4gICAgbGFiZWw6ICd3YXJuaW5nJ1xuICB9LFxuICBjb21wbGV0ZToge1xuICAgIGJhZGdlOiBmaWd1cmVzLmNoZWNrYm94T24sXG4gICAgY29sb3I6ICdjeWFuJyxcbiAgICBsYWJlbDogJ2NvbXBsZXRlJ1xuICB9LFxuICBwZW5kaW5nOiB7XG4gICAgYmFkZ2U6IGZpZ3VyZXMuY2hlY2tib3hPZmYsXG4gICAgY29sb3I6ICdtYWdlbnRhJyxcbiAgICBsYWJlbDogJ3BlbmRpbmcnXG4gIH0sXG4gIG5vdGU6IHtcbiAgICBiYWRnZTogZmlndXJlcy5idWxsZXQsXG4gICAgY29sb3I6ICdibHVlJyxcbiAgICBsYWJlbDogJ25vdGUnXG4gIH0sXG4gIHN0YXJ0OiB7XG4gICAgYmFkZ2U6IGZpZ3VyZXMucGxheSxcbiAgICBjb2xvcjogJ2dyZWVuJyxcbiAgICBsYWJlbDogJ3N0YXJ0J1xuICB9LFxuICBwYXVzZToge1xuICAgIGJhZGdlOiBmaWd1cmVzLnNxdWFyZVNtYWxsRmlsbGVkLFxuICAgIGNvbG9yOiAneWVsbG93JyxcbiAgICBsYWJlbDogJ3BhdXNlJ1xuICB9LFxuICBkZWJ1Zzoge1xuICAgIGJhZGdlOiBmaWd1cmVzKCfirKQnKSxcbiAgICBjb2xvcjogJ3JlZCcsXG4gICAgbGFiZWw6ICdkZWJ1ZydcbiAgfSxcbiAgYXdhaXQ6IHtcbiAgICBiYWRnZTogZmlndXJlcy5lbGxpcHNpcyxcbiAgICBjb2xvcjogJ2JsdWUnLFxuICAgIGxhYmVsOiAnYXdhaXRpbmcnXG4gIH0sXG4gIHdhdGNoOiB7XG4gICAgYmFkZ2U6IGZpZ3VyZXMuZWxsaXBzaXMsXG4gICAgY29sb3I6ICd5ZWxsb3cnLFxuICAgIGxhYmVsOiAnd2F0Y2hpbmcnXG4gIH0sXG4gIGxvZzoge1xuICAgIGJhZGdlOiAnJyxcbiAgICBjb2xvcjogJycsXG4gICAgbGFiZWw6ICcnXG4gIH1cbn07XG4iXX0=