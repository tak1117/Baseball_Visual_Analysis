// import React, { useState, useEffect, useRef } from 'react';
// import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
// import { Activity, TrendingUp, Eye, AlertTriangle, BarChart2, Camera, MousePointer2, ArrowRightLeft, ArrowUpCircle, User, Target } from 'lucide-react';
// import { toPng } from 'html-to-image';

// const DisparityAndAccuracyAnalysis = () => {
//   const [selectedPitch, setSelectedPitch] = useState('FF');
//   const [selectedTimeIdx, setSelectedTimeIdx] = useState(200);
  
//   const [batterHeight, setBatterHeight] = useState(170);
//   const [batterHeightInput, setBatterHeightInput] = useState('170');
//   const [heightError, setHeightError] = useState(null);
//   const [selectedCourse, setSelectedCourse] = useState('mid_mid');
  
//   const [graphMode, setGraphMode] = useState('disparity');
  
//   const [condition1, setCondition1] = useState({ stance: 'open', position: 'inner' });
//   const [condition2, setCondition2] = useState({ stance: 'square', position: 'inner' });

//   const [data, setData] = useState([]);
//   const [eyePositions, setEyePositions] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const printRef = useRef(null);

//   const HEIGHT_MIN = 160;
//   const HEIGHT_MAX = 200;
  
//   const PHASE_TIMING = {
//     RELEASE: 0,
//     PERCEPTION_END: 150,
//     SWING_START_MIN: 190,
//     SWING_START_MAX: 290,
//     BALL_ARRIVAL: 440
//   };
  
//   const pitchTypes = {
//     'FF': { name: 'ストレート (FF)', fullName: 'Straight', color: '#E63946' },
//     'ST': { name: 'スイーパー (ST)', fullName: 'Sweeper', color: '#457B9D' },
//     'CU': { name: 'カーブ (CU)', fullName: 'Curve', color: '#9B59B6' },
//     'SI': { name: 'シンカー (SI)', fullName: 'Sinker', color: '#2A9D8F' }
//   };

//   const courseOptions = {
//     'high_in': { name: 'インコース高め', row: 0, col: 0 },
//     'high_mid': { name: '真ん中高め', row: 0, col: 1 },
//     'high_out': { name: 'アウトコース高め', row: 0, col: 2 },
//     'mid_in': { name: 'インコース真ん中', row: 1, col: 0 },
//     'mid_mid': { name: '真ん中', row: 1, col: 1 },
//     'mid_out': { name: 'アウトコース真ん中', row: 1, col: 2 },
//     'low_in': { name: 'インコース低め', row: 2, col: 0 },
//     'low_mid': { name: '真ん中低め', row: 2, col: 1 },
//     'low_out': { name: 'アウトコース低め', row: 2, col: 2 }
//   };

//   const STEREO_ACUITY_ARCSEC = 100; 
//   const STEREO_ACUITY_RAD = (STEREO_ACUITY_ARCSEC / 3600) * (Math.PI / 180);

//   const EYE_HEIGHT_RATIO = 159.6 / 171.4;

//   const calculateEyeHeight = (heightCm) => {
//     return (heightCm * EYE_HEIGHT_RATIO) / 100;
//   };

//   const currentEyeHeight = calculateEyeHeight(batterHeight);

//   const getBoxPositions = (eyeHeight) => ({
//     'inner': [-0.45, 0.0, eyeHeight],
//     'middle': [-0.90, 0.0, eyeHeight]
//   });

//   const boxPositions = getBoxPositions(currentEyeHeight);
//   const positionLabels = { 'inner': '内側', 'middle': '真ん中' };
//   const stanceAngles = { 'open': 0, 'square': -30 };
//   const stanceLabels = { 'open': 'Open', 'square': 'Square' };

//   const timeTicks = [0, 100, 200, 300, 400];
//   const errorTicks = [0, 500, 1000, 1500, 2000, 2500, 3000];

//   // 軸ラベルの共通スタイル
//   const axisLabelStyle = {
//     fontSize: 13,
//     fontWeight: 600,
//     fill: '#374151'
//   };

//   const axisTick = {
//     fontSize: 11,
//     fill: '#6b7280'
//   };

//   const getCSVPath = (height, course, pitch) => {
//     return `/${height}/${course}/${pitch}.csv`;
//   };

//   const loadCSV = async (filepath) => {
//     try {
//       const response = await fetch(filepath);
//       if (!response.ok) throw new Error(`Failed to load ${filepath}`);
//       const text = await response.text();
//       const lines = text.trim().split('\n');
//       return lines.slice(1).map(line => {
//         const values = line.split(',');
//         return {
//           time_s: parseFloat(values[0]),
//           x_m: parseFloat(values[1]),
//           y_m: parseFloat(values[2]),
//           z_m: parseFloat(values[3]),
//           distance_m: parseFloat(values[2]) 
//         };
//       });
//     } catch (err) {
//       console.error('CSV読み込みエラー:', err);
//       throw err;
//     }
//   };

//   const subVec = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
//   const normVec = (v) => Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
//   const normalize = (v) => { const n = normVec(v); return [v[0]/n, v[1]/n, v[2]/n]; };
//   const dotVec = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
//   const crossVec = (a, b) => [
//     a[1]*b[2] - a[2]*b[1],
//     a[2]*b[0] - a[0]*b[2],
//     a[0]*b[1] - a[1]*b[0]
//   ];

//   const calculateEyePositions = (yawDeg, headCenter) => {
//     const rad = (yawDeg * Math.PI) / 180;
//     const halfIPD = 0.031;
//     return {
//       leftEye: [headCenter[0] - halfIPD * Math.cos(rad), headCenter[1] - halfIPD * Math.sin(rad), headCenter[2]],
//       rightEye: [headCenter[0] + halfIPD * Math.cos(rad), headCenter[1] + halfIPD * Math.sin(rad), headCenter[2]],
//       headCenter
//     };
//   };

//   const calculateVisualAngle = (eyePos, ballPos) => {
//     const targetPos = [0.0, 18.44, 1.714];
//     const camFwd = normalize(subVec(targetPos, eyePos));
//     const worldUp = [0, 0, 1];
//     const camRight = normalize(crossVec(camFwd, worldUp));
    
//     const vec = subVec(ballPos, eyePos);
//     const zLocal = dotVec(vec, camFwd);
//     const xLocal = dotVec(vec, camRight);
    
//     if (zLocal < 0.02) return null;
//     return Math.atan2(xLocal, zLocal) * 180 / Math.PI;
//   };

//   const decomposeTrajectory = (fullData, currentIndex, eyePos) => {
//     if (!fullData || fullData.length < 2 || currentIndex < 1) return null;

//     const startIdx = 0;
//     const endIdx = currentIndex;

//     const startPos = [fullData[startIdx].x_m, fullData[startIdx].y_m, fullData[startIdx].z_m];
//     const endPos = [fullData[endIdx].x_m, fullData[endIdx].y_m, fullData[endIdx].z_m];

//     const targetPos = [0.0, 18.44, 1.7];
//     const camFwd = normalize(subVec(targetPos, eyePos));
//     const worldUp = [0.0, 0.0, 1.0];
//     const camRight = normalize(crossVec(camFwd, worldUp));

//     const getAngle = (pos) => {
//       const vec = subVec(pos, eyePos);
//       const zLocal = dotVec(vec, camFwd);
//       const xLocal = dotVec(vec, camRight);
//       return Math.atan2(xLocal, zLocal) * 180 / Math.PI;
//     };

//     const angleStart = getAngle(startPos);
//     const virtualPos = [endPos[0], startPos[1], startPos[2]];
//     const angleVirtual = getAngle(virtualPos);
//     const angleEnd = getAngle(endPos);

//     const courseChange = Math.abs(angleVirtual - angleStart);
//     const trajectoryEffect = Math.abs(angleVirtual - angleEnd);
//     const totalChange = courseChange + trajectoryEffect;

//     return {
//       total: totalChange,
//       course: courseChange,
//       trajectory: trajectoryEffect,
//       courseRatio: totalChange > 0 ? (courseChange / totalChange) * 100 : 0,
//       trajectoryRatio: totalChange > 0 ? (trajectoryEffect / totalChange) * 100 : 0,
//       angleStart,
//       angleEnd
//     };
//   };

//   const handleHeightInputChange = (e) => {
//     const inputValue = e.target.value;
//     setBatterHeightInput(inputValue);
    
//     if (inputValue === '') {
//       setHeightError(null);
//       return;
//     }
    
//     const value = parseInt(inputValue, 10);
    
//     if (isNaN(value)) {
//       setHeightError('数値を入力してください');
//     } else if (value < HEIGHT_MIN || value > HEIGHT_MAX) {
//       setHeightError(`対象外の身長です（${HEIGHT_MIN}〜${HEIGHT_MAX}cmの範囲で入力してください）`);
//     } else {
//       setHeightError(null);
//       setBatterHeight(value);
//     }
//   };

//   const handleHeightBlur = () => {
//     if (heightError || batterHeightInput === '') {
//       setBatterHeightInput(batterHeight.toString());
//       setHeightError(null);
//     }
//   };

//   useEffect(() => {
//     const loadAndCalculate = async () => {
//       if (heightError) return;
      
//       setLoading(true);
//       setError(null);
      
//       try {
//         const csvPath = getCSVPath(batterHeight, selectedCourse, selectedPitch);
//         const csvData = await loadCSV(csvPath);
        
//         const safeC1Pos = boxPositions[condition1.position] ? condition1.position : 'inner';
//         const safeC1Stance = stanceAngles[condition1.stance] !== undefined ? condition1.stance : 'open';
        
//         const safeC2Pos = boxPositions[condition2.position] ? condition2.position : 'inner';
//         const safeC2Stance = stanceAngles[condition2.stance] !== undefined ? condition2.stance : 'square';

//         const c1Head = boxPositions[safeC1Pos];
//         const c1Angle = stanceAngles[safeC1Stance];
//         const c1EyesCalc = calculateEyePositions(c1Angle, c1Head);

//         const c2Head = boxPositions[safeC2Pos];
//         const c2Angle = stanceAngles[safeC2Stance];
//         const c2EyesCalc = calculateEyePositions(c2Angle, c2Head);
        
//         setEyePositions({ c1: c1EyesCalc, c2: c2EyesCalc });

//         const results = csvData.map(row => {
//           const ballPos = [row.x_m, row.y_m, row.z_m];
          
//           const c1L = calculateVisualAngle(c1EyesCalc.leftEye, ballPos);
//           const c1R = calculateVisualAngle(c1EyesCalc.rightEye, ballPos);
//           const c1Disp = (c1L !== null && c1R !== null) ? c1L - c1R : 0.0001;

//           const c2L = calculateVisualAngle(c2EyesCalc.leftEye, ballPos);
//           const c2R = calculateVisualAngle(c2EyesCalc.rightEye, ballPos);
//           const c2Disp = (c2L !== null && c2R !== null) ? c2L - c2R : 0.0001;
          
//           const c1DispRad = c1Disp * Math.PI / 180;
//           const c2DispRad = c2Disp * Math.PI / 180;
          
//           const c1Error = (row.distance_m / c1DispRad) * STEREO_ACUITY_RAD * 100;
//           const c2Error = (row.distance_m / c2DispRad) * STEREO_ACUITY_RAD * 100;

//           return {
//             time_s: row.time_s,
//             time_ms: row.time_s * 1000,
//             x_m: row.x_m,
//             y_m: row.y_m,
//             z_m: row.z_m,
//             c1_disparity: c1Disp,
//             c2_disparity: c2Disp,
//             c1_error: c1Error,
//             c2_error: c2Error,
//             c1_visual_angle: c1R,
//             c2_visual_angle: c2R,
//             distance: row.distance_m
//           };
//         }).filter(d => d.distance > 0.05);
        
//         setData(results);
//         setLoading(false);
//       } catch (err) {
//         setError(err.message);
//         setLoading(false);
//       }
//     };
    
//     loadAndCalculate();
//   }, [selectedPitch, selectedCourse, batterHeight, condition1, condition2, heightError]);

//   const currentDetail = data.length > 0 ? 
//     (data[selectedTimeIdx] || data[data.length - 1]) : null;

//   const c1Decomposition = (data.length > 0 && eyePositions) 
//     ? decomposeTrajectory(data, selectedTimeIdx, eyePositions.c1.rightEye) 
//     : null;
    
//   const c2Decomposition = (data.length > 0 && eyePositions) 
//     ? decomposeTrajectory(data, selectedTimeIdx, eyePositions.c2.rightEye) 
//     : null;

//   const getPhaseLabel = (timeMs) => {
//     if (timeMs < PHASE_TIMING.PERCEPTION_END) {
//       return '視覚情報処理・タイミング知覚';
//     }
//     if (timeMs < PHASE_TIMING.SWING_START_MIN) {
//       return '判断完了・スイング準備';
//     }
//     if (timeMs < PHASE_TIMING.SWING_START_MAX) {
//       return 'スイング開始可能区間';
//     }
//     return '運動調整・スイング実行';
//   };

//   const getPhaseStyle = (timeMs) => {
//     if (timeMs < PHASE_TIMING.PERCEPTION_END) {
//       return 'bg-blue-100 text-blue-800';
//     }
//     if (timeMs < PHASE_TIMING.SWING_START_MIN) {
//       return 'bg-cyan-100 text-cyan-800';
//     }
//     if (timeMs < PHASE_TIMING.SWING_START_MAX) {
//       return 'bg-yellow-100 text-yellow-800';
//     }
//     return 'bg-red-100 text-red-800';
//   };

//   const getTickPosition = (timeMs) => {
//     if (data.length === 0) return 0;
//     const maxTime = data[data.length - 1].time_ms;
//     const minTime = data[0].time_ms;
//     return ((timeMs - minTime) / (maxTime - minTime)) * 100;
//   };

//   const handleSaveImage = async () => {
//     if (!printRef.current) return;
//     try {
//       const dataUrl = await toPng(printRef.current, {
//         quality: 1.0,
//         pixelRatio: 2,
//         backgroundColor: '#ffffff',
//       });
//       const link = document.createElement('a');
//       link.href = dataUrl;
//       link.download = `analysis_${batterHeight}cm_${selectedCourse}_${selectedPitch}_${graphMode}.png`;
//       link.click();
//     } catch (error) {
//       console.error('画像保存エラー:', error);
//       alert('画像の保存に失敗しました');
//     }
//   };

//   const renderChart = () => {
//     const timelineReferenceLine = (
//       <ReferenceLine x={currentDetail?.time_ms} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={2} />
//     );

//     if (graphMode === 'disparity') {
//       return (
//         <LineChart data={data} margin={{ top: 25, right: 30, bottom: 50, left: 70 }}>
//           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
//           <XAxis 
//             dataKey="time_ms" 
//             ticks={timeTicks} 
//             type="number" 
//             domain={[0, 400]}
//             tick={axisTick}
//             tickLine={{ stroke: '#9ca3af' }}
//             axisLine={{ stroke: '#9ca3af' }}
//           >
//             <Label value="経過時間 (ms)" position="bottom" offset={30} style={axisLabelStyle} />
//           </XAxis>
//           <YAxis 
//             tick={axisTick}
//             tickLine={{ stroke: '#9ca3af' }}
//             axisLine={{ stroke: '#9ca3af' }}
//             tickFormatter={(val) => val.toFixed(2)}
//           >
//             <Label value="両眼視差 (°)" position="left" angle={-90} offset={15} style={{ ...axisLabelStyle, textAnchor: 'middle' }} dy={-10} />
//           </YAxis>
//           <Tooltip 
//             formatter={(val) => `${val.toFixed(4)}°`} 
//             labelFormatter={(label) => `${label.toFixed(0)} ms`}
//             contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
//           />
//           <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
//           {timelineReferenceLine}
//           <Line type="monotone" dataKey="c1_disparity" name="Condition 1" stroke="#2563eb" strokeWidth={3} dot={false} />
//           <Line type="monotone" dataKey="c2_disparity" name="Condition 2" stroke="#f97316" strokeWidth={3} dot={false} />
//         </LineChart>
//       );
//     }
//     if (graphMode === 'accuracy') {
//       return (
//         <AreaChart data={data} margin={{ top: 25, right: 30, bottom: 50, left: 70 }}>
//           <defs>
//             <linearGradient id="colorC1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
//             <linearGradient id="colorC2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
//           </defs>
//           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
//           <XAxis 
//             dataKey="time_ms" 
//             ticks={timeTicks} 
//             type="number" 
//             domain={[0, 400]}
//             tick={axisTick}
//             tickLine={{ stroke: '#9ca3af' }}
//             axisLine={{ stroke: '#9ca3af' }}
//           >
//             <Label value="経過時間 (ms)" position="bottom" offset={30} style={axisLabelStyle} />
//           </XAxis>
//           <YAxis 
//             domain={[0, 3000]} 
//             ticks={errorTicks}
//             tick={axisTick}
//             tickLine={{ stroke: '#9ca3af' }}
//             axisLine={{ stroke: '#9ca3af' }}
//           >
//             <Label value="認識誤差 (±cm)" position="left" angle={-90} offset={15} style={{ ...axisLabelStyle, textAnchor: 'middle' }} dy={-10} />
//           </YAxis>
//           <Tooltip 
//             formatter={(val) => `±${val.toFixed(1)} cm`} 
//             labelFormatter={(label) => `${label.toFixed(0)} ms`}
//             contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
//           />
//           <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
//           {timelineReferenceLine}
//           <Area type="monotone" dataKey="c1_error" name="Condition 1" stroke="#2563eb" fill="url(#colorC1)" strokeWidth={2} />
//           <Area type="monotone" dataKey="c2_error" name="Condition 2" stroke="#f97316" fill="url(#colorC2)" strokeWidth={2} />
//         </AreaChart>
//       );
//     }
//     if (graphMode === 'trajectory') {
//       return (
//         <LineChart data={data} margin={{ top: 25, right: 30, bottom: 50, left: 70 }}>
//           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
//           <XAxis 
//             dataKey="time_ms" 
//             type="number" 
//             ticks={timeTicks} 
//             domain={[0, 400]}
//             tick={axisTick}
//             tickLine={{ stroke: '#9ca3af' }}
//             axisLine={{ stroke: '#9ca3af' }}
//           >
//             <Label value="経過時間 (ms)" position="bottom" offset={30} style={axisLabelStyle} />
//           </XAxis>
//           <YAxis 
//             type="number" 
//             domain={['auto', 'auto']}
//             tick={axisTick}
//             tickLine={{ stroke: '#9ca3af' }}
//             axisLine={{ stroke: '#9ca3af' }}
//             tickFormatter={(val) => val.toFixed(1)}
//           >
//             <Label value="水平視角 (°)" position="left" angle={-90} offset={15} style={{ ...axisLabelStyle, textAnchor: 'middle' }} dy={-10} />
//           </YAxis>
//           <Tooltip 
//             cursor={{strokeDasharray: '3 3'}} 
//             formatter={(val) => `${val.toFixed(2)}°`} 
//             labelFormatter={(label) => `${label.toFixed(0)} ms`}
//             contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
//           />
//           <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
//           {timelineReferenceLine}
//           <Line type="monotone" dataKey="c1_visual_angle" name="Condition 1" stroke="#2563eb" strokeWidth={3} dot={false} />
//           <Line type="monotone" dataKey="c2_visual_angle" name="Condition 2" stroke="#f97316" strokeWidth={3} dot={false} />
//         </LineChart>
//       );
//     }
//   };

//   const renderDecompositionStats = (result, colorClass, barColor) => {
//     if (!result) return null;
//     return (
//       <div className="mt-2">
//         <div className="flex justify-between items-end mb-2">
//            <span className="text-xs text-gray-500 font-bold">視覚移動の内訳 (0ms → 現在)</span>
//            <span className="text-xl font-bold text-gray-800">{result.total.toFixed(2)}° <span className="text-xs font-normal text-gray-400">移動</span></span>
//         </div>
        
//         <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex mb-2">
//           <div style={{ width: `${result.courseRatio}%` }} className={`h-full ${barColor} opacity-80`}></div>
//           <div style={{ width: `${result.trajectoryRatio}%` }} className="h-full bg-gray-400 opacity-30"></div>
//         </div>

//         <div className="grid grid-cols-2 gap-2 text-sm">
//            <div className="bg-gray-50 p-2 rounded border border-gray-100">
//               <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
//                  <ArrowRightLeft size={12} /> コース変化
//               </div>
//               <div className={`font-bold ${colorClass}`}>
//                  {result.courseRatio.toFixed(1)}% <span className="text-xs text-gray-400">({result.course.toFixed(2)}°)</span>
//               </div>
//            </div>
//            <div className="bg-gray-50 p-2 rounded border border-gray-100">
//               <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
//                  <ArrowUpCircle size={12} /> 球筋効果(奥行)
//               </div>
//               <div className="font-bold text-gray-600">
//                  {result.trajectoryRatio.toFixed(1)}% <span className="text-xs text-gray-400">({result.trajectory.toFixed(2)}°)</span>
//               </div>
//            </div>
//         </div>
//         <p className="text-[10px] text-gray-400 mt-1 text-right">※Y座標固定時のX移動 vs 奥行移動</p>
//       </div>
//     );
//   };

//   const renderCourseGrid = () => {
//     const grid = [
//       ['high_in', 'high_mid', 'high_out'],
//       ['mid_in', 'mid_mid', 'mid_out'],
//       ['low_in', 'low_mid', 'low_out']
//     ];
    
//     const getShortLabel = (course) => {
//       const labels = {
//         'high_in': 'イン\n高め',
//         'high_mid': '中\n高め',
//         'high_out': 'アウト\n高め',
//         'mid_in': 'イン\n中',
//         'mid_mid': '真ん中',
//         'mid_out': 'アウト\n中',
//         'low_in': 'イン\n低め',
//         'low_mid': '中\n低め',
//         'low_out': 'アウト\n低め'
//       };
//       return labels[course] || course;
//     };
    
//     return (
//       <div className="bg-gradient-to-b from-green-800 to-green-900 p-3 rounded-xl shadow-inner">
//         <div className="grid grid-cols-3 gap-1">
//           {grid.map((row, rowIdx) => (
//             row.map((course, colIdx) => {
//               const isSelected = selectedCourse === course;
//               return (
//                 <button
//                   key={course}
//                   onClick={() => setSelectedCourse(course)}
//                   className={`
//                     aspect-square rounded-lg text-xs font-bold transition-all duration-200
//                     flex items-center justify-center whitespace-pre-line text-center
//                     ${isSelected 
//                       ? 'bg-red-500 text-white shadow-lg scale-105 ring-2 ring-red-300' 
//                       : 'bg-white/90 text-gray-700 hover:bg-yellow-100 hover:scale-102'
//                     }
//                   `}
//                   style={{ minHeight: '52px' }}
//                 >
//                   {getShortLabel(course)}
//                 </button>
//               );
//             })
//           ))}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="w-full max-w-7xl mx-auto p-4 bg-gray-50 font-sans">
//       <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
//           <h1 className="text-2xl font-bold text-slate-800 mb-2 md:mb-0 flex items-center gap-2">
//             <BarChart2 className="w-8 h-8 text-indigo-600" />
//             VR野球 視覚指標分析
//           </h1>
//           <button onClick={handleSaveImage} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg shadow transition-colors">
//             <Camera className="w-5 h-5" /> <span>結果を画像保存</span>
//           </button>
//         </div>

//         <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-5 mb-6">
//           <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
//             <Target className="w-5 h-5 text-emerald-600" />
//             投球設定
//           </h2>
          
//           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//             <div className="lg:col-span-3">
//               <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
//                 <User className="w-4 h-4 text-blue-500" />
//                 バッター身長
//               </label>
//               <div className="flex items-center gap-2">
//                 <input
//                   type="number"
//                   min={HEIGHT_MIN}
//                   max={HEIGHT_MAX}
//                   value={batterHeightInput}
//                   onChange={handleHeightInputChange}
//                   onBlur={handleHeightBlur}
//                   className={`w-24 px-3 py-2 border rounded-lg text-center font-mono text-lg font-bold focus:ring-2 focus:outline-none ${
//                     heightError 
//                       ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50' 
//                       : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
//                   }`}
//                 />
//                 <span className="text-gray-600 font-medium">cm</span>
//               </div>
//               {heightError ? (
//                 <p className="text-xs text-red-500 mt-1 font-medium">{heightError}</p>
//               ) : (
//                 <div className="text-xs text-gray-400 mt-1">
//                   <p>{HEIGHT_MIN}〜{HEIGHT_MAX}cmの範囲</p>
//                   <p className="text-blue-500 font-medium">眼高: {(currentEyeHeight * 100).toFixed(1)}cm ({currentEyeHeight.toFixed(3)}m)</p>
//                 </div>
//               )}
//             </div>

//             <div className="lg:col-span-4">
//               <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
//                 <Target className="w-4 h-4 text-red-500" />
//                 コース: <span className="text-red-600">{courseOptions[selectedCourse].name}</span>
//               </label>
//               {renderCourseGrid()}
//             </div>

//             <div className="lg:col-span-5">
//               <label className="block text-sm font-bold text-gray-700 mb-2">
//                 球種
//               </label>
//               <div className="grid grid-cols-2 gap-2">
//                 {Object.entries(pitchTypes).map(([key, pitch]) => (
//                   <button
//                     key={key}
//                     onClick={() => { setSelectedPitch(key); setSelectedTimeIdx(Math.min(200, data.length - 1)); }}
//                     className={`
//                       px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2
//                       ${selectedPitch === key 
//                         ? 'text-white shadow-lg scale-102' 
//                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                       }
//                     `}
//                     style={selectedPitch === key ? { backgroundColor: pitch.color } : {}}
//                   >
//                     <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pitch.color }}></span>
//                     {pitch.name}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//           <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
//             <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
//               <span className="w-3 h-3 rounded-full bg-blue-600"></span> Condition 1 (基準)
//             </h3>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-xs text-blue-600 mb-1">スタンス</label>
//                 <select className="w-full p-2 rounded border border-blue-200 text-sm" value={condition1.stance} onChange={(e) => setCondition1({...condition1, stance: e.target.value})}>
//                   {Object.keys(stanceAngles).map(k => <option key={k} value={k}>{stanceLabels[k]}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-xs text-blue-600 mb-1">打席位置</label>
//                 <select className="w-full p-2 rounded border border-blue-200 text-sm" value={condition1.position} onChange={(e) => setCondition1({...condition1, position: e.target.value})}>
//                   {Object.keys(boxPositions).map(k => <option key={k} value={k}>{positionLabels[k]}</option>)}
//                 </select>
//               </div>
//             </div>
//           </div>
//           <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
//             <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-3">
//               <span className="w-3 h-3 rounded-full bg-orange-500"></span> Condition 2 (比較)
//             </h3>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-xs text-orange-600 mb-1">スタンス</label>
//                 <select className="w-full p-2 rounded border border-orange-200 text-sm" value={condition2.stance} onChange={(e) => setCondition2({...condition2, stance: e.target.value})}>
//                   {Object.keys(stanceAngles).map(k => <option key={k} value={k}>{stanceLabels[k]}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-xs text-orange-600 mb-1">打席位置</label>
//                 <select className="w-full p-2 rounded border border-orange-200 text-sm" value={condition2.position} onChange={(e) => setCondition2({...condition2, position: e.target.value})}>
//                   {Object.keys(boxPositions).map(k => <option key={k} value={k}>{positionLabels[k]}</option>)}
//                 </select>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div ref={printRef} className="bg-white p-4 rounded-xl border border-transparent">
//           <div className="mb-4 text-center border-b pb-2">
//              <h2 className="text-lg font-bold text-gray-700">
//                {pitchTypes[selectedPitch].name} - {courseOptions[selectedCourse].name} (身長{batterHeight}cm)
//              </h2>
//              <p className="text-xs text-gray-500">
//                Condition 1: {stanceLabels[condition1.stance]}/{positionLabels[condition1.position]} vs 
//                Condition 2: {stanceLabels[condition2.stance]}/{positionLabels[condition2.position]}
//              </p>
//           </div>

//           {error && (
//             <div className="p-6 bg-red-50 border border-red-200 rounded-xl mb-4">
//               <div className="text-red-600 font-bold mb-2">データ読み込みエラー</div>
//               <div className="text-red-500 text-sm">{error}</div>
//               <div className="text-gray-500 text-xs mt-2">
//                 ファイルパス: ./public/{batterHeight}/{selectedCourse}/{selectedPitch}.csv
//               </div>
//             </div>
//           )}

//           {!error && !loading && data.length > 0 && (
//             <div className="mb-6">
//               <div className="flex items-center justify-between mb-4 pb-4">
//                 <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
//                   <button onClick={() => setGraphMode('disparity')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center ${graphMode === 'disparity' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
//                     <TrendingUp className="w-4 h-4 mr-2" />両眼視差
//                   </button>
//                   <button onClick={() => setGraphMode('accuracy')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center ${graphMode === 'accuracy' ? 'bg-white text-rose-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
//                     <AlertTriangle className="w-4 h-4 mr-2" />認識誤差
//                   </button>
//                   <button onClick={() => setGraphMode('trajectory')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center ${graphMode === 'trajectory' ? 'bg-white text-emerald-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
//                     <Eye className="w-4 h-4 mr-2" />視覚軌道
//                   </button>
//                 </div>
//               </div>
              
//               <div className="h-[450px] w-full">
//                 <ResponsiveContainer width="100%" height="100%">
//                   {renderChart()}
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           )}

//           {loading && !error && (
//             <div className="h-[450px] w-full flex items-center justify-center">
//               <div className="text-gray-500">
//                 <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
//                 データ読み込み中...
//               </div>
//             </div>
//           )}

//           {!error && !loading && currentDetail && (
//             <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
//                <div className="flex items-center justify-between mb-6">
//                   <div>
//                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${getPhaseStyle(currentDetail.time_ms)}`}>
//                         {getPhaseLabel(currentDetail.time_ms)} ({currentDetail.time_ms.toFixed(0)}ms時点)
//                      </span>
//                      <p className="text-sm text-gray-500 mt-2">ボール距離: {currentDetail.distance.toFixed(2)}m</p>
//                   </div>
//                </div>

//               <div className="w-full mb-8 px-2 relative">
//                 <div className="flex justify-between items-end mb-2">
//                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
//                      <MousePointer2 className="w-4 h-4"/> 
//                      タイムライン位置
//                    </label>
//                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">Frame: {selectedTimeIdx}</span>
//                 </div>
//                 <input type="range" min="0" max={data.length - 1} value={selectedTimeIdx} onChange={(e) => setSelectedTimeIdx(Number(e.target.value))} className="w-full h-6 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 relative z-10" />
//                 <div className="relative w-full h-6 mt-2 text-xs text-gray-500 font-medium">
//                   <div className="absolute transform -translate-x-0" style={{left: '0%'}}>0ms</div>
//                   {data.length > 0 && data[data.length-1].time_ms > PHASE_TIMING.PERCEPTION_END && (
//                      <div className="absolute transform -translate-x-1/2 text-center text-blue-600 font-bold" style={{left: `${getTickPosition(PHASE_TIMING.PERCEPTION_END)}%`}}>150ms</div>
//                   )}
//                   {data.length > 0 && data[data.length-1].time_ms > PHASE_TIMING.SWING_START_MAX && (
//                      <div className="absolute transform -translate-x-1/2 text-center text-red-600 font-bold" style={{left: `${getTickPosition(PHASE_TIMING.SWING_START_MAX)}%`}}>290ms</div>
//                   )}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
//                 <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
//                   <div className="flex justify-between items-start mb-4">
//                     <h4 className="font-bold text-gray-600">Condition 1 (基準)</h4>
//                   </div>
                  
//                   {graphMode === 'trajectory' ? (
//                      renderDecompositionStats(c1Decomposition, "text-blue-600", "bg-blue-600")
//                   ) : (
//                     <div className="grid grid-cols-2 gap-4">
//                       <div><p className="text-xs text-gray-400 mb-1">両眼視差</p><p className="text-2xl font-bold text-slate-800">{currentDetail.c1_disparity.toFixed(4)}°</p></div>
//                       <div><p className="text-xs text-gray-400 mb-1">認識誤差</p><p className="text-2xl font-bold text-blue-600">±{currentDetail.c1_error.toFixed(1)} cm</p></div>
//                     </div>
//                   )}
//                 </div>

//                 <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
//                   <div className="flex justify-between items-start mb-4">
//                      <h4 className="font-bold text-gray-600">Condition 2 (比較)</h4>
//                   </div>

//                   {graphMode === 'trajectory' ? (
//                      renderDecompositionStats(c2Decomposition, "text-orange-600", "bg-orange-500")
//                   ) : (
//                     <>
//                       <div className="grid grid-cols-2 gap-4">
//                         <div><p className="text-xs text-gray-400 mb-1">両眼視差</p><p className="text-2xl font-bold text-slate-800">{currentDetail.c2_disparity.toFixed(4)}°</p></div>
//                         <div><p className="text-xs text-gray-400 mb-1">認識誤差</p><p className="text-2xl font-bold text-orange-600">±{currentDetail.c2_error.toFixed(1)} cm</p></div>
//                       </div>
//                       <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
//                         {currentDetail.c2_error > currentDetail.c1_error ? (
//                           <div className="flex items-center text-red-600 font-bold"><TrendingUp className="w-4 h-4 mr-2" />誤差 {((currentDetail.c2_error / currentDetail.c1_error - 1) * 100).toFixed(1)}% 拡大</div>
//                         ) : (
//                           <div className="flex items-center text-green-600 font-bold"><TrendingUp className="w-4 h-4 mr-2" transform="scale(1, -1)" />誤差 {((1 - currentDetail.c2_error / currentDetail.c1_error) * 100).toFixed(1)}% 縮小</div>
//                         )}
//                       </div>
//                     </>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DisparityAndAccuracyAnalysis;

import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { Activity, TrendingUp, Eye, AlertTriangle, BarChart2, Camera, MousePointer2, ArrowRightLeft, ArrowUpCircle, User, Target } from 'lucide-react';
import { toPng } from 'html-to-image';

const DisparityAndAccuracyAnalysis = () => {
  const [selectedPitch, setSelectedPitch] = useState('FF');
  const [selectedTimeIdx, setSelectedTimeIdx] = useState(200);
  
  const [batterHeight, setBatterHeight] = useState(170);
  const [batterHeightInput, setBatterHeightInput] = useState('170');
  const [heightError, setHeightError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('mid_mid');
  
  const [graphMode, setGraphMode] = useState('disparity');
  
  const [condition1, setCondition1] = useState({ stance: 'open', position: 'inner' });
  const [condition2, setCondition2] = useState({ stance: 'square', position: 'inner' });

  const [data, setData] = useState([]);
  const [eyePositions, setEyePositions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const printRef = useRef(null);

  const HEIGHT_MIN = 160;
  const HEIGHT_MAX = 200;
  
  const PHASE_TIMING = {
    RELEASE: 0,
    PERCEPTION_END: 150,
    SWING_START_MIN: 190,
    SWING_START_MAX: 290,
    BALL_ARRIVAL: 440
  };
  
  const pitchTypes = {
    'FF': { name: 'ストレート (FF)', fullName: 'Straight', color: '#E63946' },
    'ST': { name: 'スイーパー (ST)', fullName: 'Sweeper', color: '#457B9D' },
    'CU': { name: 'カーブ (CU)', fullName: 'Curve', color: '#9B59B6' },
    'SI': { name: 'シンカー (SI)', fullName: 'Sinker', color: '#2A9D8F' }
  };

  const courseOptions = {
    'high_in': { name: 'インコース高め', row: 0, col: 0 },
    'high_mid': { name: '真ん中高め', row: 0, col: 1 },
    'high_out': { name: 'アウトコース高め', row: 0, col: 2 },
    'mid_in': { name: 'インコース真ん中', row: 1, col: 0 },
    'mid_mid': { name: '真ん中', row: 1, col: 1 },
    'mid_out': { name: 'アウトコース真ん中', row: 1, col: 2 },
    'low_in': { name: 'インコース低め', row: 2, col: 0 },
    'low_mid': { name: '真ん中低め', row: 2, col: 1 },
    'low_out': { name: 'アウトコース低め', row: 2, col: 2 }
  };

  const STEREO_ACUITY_ARCSEC = 100; 
  const STEREO_ACUITY_RAD = (STEREO_ACUITY_ARCSEC / 3600) * (Math.PI / 180);

  const EYE_HEIGHT_RATIO = 159.6 / 171.4;

  const calculateEyeHeight = (heightCm) => {
    return (heightCm * EYE_HEIGHT_RATIO) / 100;
  };

  const currentEyeHeight = calculateEyeHeight(batterHeight);

  const getBoxPositions = (eyeHeight) => ({
    'inner': [-0.45, 0.0, eyeHeight],
    'middle': [-0.90, 0.0, eyeHeight]
  });

  const boxPositions = getBoxPositions(currentEyeHeight);
  const positionLabels = { 'inner': '内側', 'middle': '真ん中' };
  const stanceAngles = { 'open': 0, 'square': -30 };
  const stanceLabels = { 'open': 'Open', 'square': 'Square' };

  const timeTicks = [0, 100, 200, 300, 400];
  const errorTicks = [0, 500, 1000, 1500, 2000, 2500, 3000];

  // 軸ラベルの共通スタイル
  const axisLabelStyle = {
    fontSize: 18,
    fontWeight: 600,
    fill: '#374151'
  };

  const axisTick = {
    fontSize: 18,
    fill: '#6b7280'
  };

  const getCSVPath = (height, course, pitch) => {
    return `/${height}/${course}/${pitch}.csv`;
  };

  const loadCSV = async (filepath) => {
    try {
      const response = await fetch(filepath);
      if (!response.ok) throw new Error(`Failed to load ${filepath}`);
      const text = await response.text();
      const lines = text.trim().split('\n');
      return lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          time_s: parseFloat(values[0]),
          x_m: parseFloat(values[1]),
          y_m: parseFloat(values[2]),
          z_m: parseFloat(values[3]),
          distance_m: parseFloat(values[2]) 
        };
      });
    } catch (err) {
      console.error('CSV読み込みエラー:', err);
      throw err;
    }
  };

  const subVec = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
  const normVec = (v) => Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
  const normalize = (v) => { const n = normVec(v); return [v[0]/n, v[1]/n, v[2]/n]; };
  const dotVec = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const crossVec = (a, b) => [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0]
  ];

  const calculateEyePositions = (yawDeg, headCenter) => {
    const rad = (yawDeg * Math.PI) / 180;
    const halfIPD = 0.031;
    return {
      leftEye: [headCenter[0] - halfIPD * Math.cos(rad), headCenter[1] - halfIPD * Math.sin(rad), headCenter[2]],
      rightEye: [headCenter[0] + halfIPD * Math.cos(rad), headCenter[1] + halfIPD * Math.sin(rad), headCenter[2]],
      headCenter
    };
  };

  const calculateVisualAngle = (eyePos, ballPos) => {
    const targetPos = [0.0, 18.44, 1.714];
    const camFwd = normalize(subVec(targetPos, eyePos));
    const worldUp = [0, 0, 1];
    const camRight = normalize(crossVec(camFwd, worldUp));
    
    const vec = subVec(ballPos, eyePos);
    const zLocal = dotVec(vec, camFwd);
    const xLocal = dotVec(vec, camRight);
    
    if (zLocal < 0.02) return null;
    return Math.atan2(xLocal, zLocal) * 180 / Math.PI;
  };

  const decomposeTrajectory = (fullData, currentIndex, eyePos) => {
    if (!fullData || fullData.length < 2 || currentIndex < 1) return null;

    const startIdx = 0;
    const endIdx = currentIndex;

    const startPos = [fullData[startIdx].x_m, fullData[startIdx].y_m, fullData[startIdx].z_m];
    const endPos = [fullData[endIdx].x_m, fullData[endIdx].y_m, fullData[endIdx].z_m];

    const targetPos = [0.0, 18.44, 1.7];
    const camFwd = normalize(subVec(targetPos, eyePos));
    const worldUp = [0.0, 0.0, 1.0];
    const camRight = normalize(crossVec(camFwd, worldUp));

    const getAngle = (pos) => {
      const vec = subVec(pos, eyePos);
      const zLocal = dotVec(vec, camFwd);
      const xLocal = dotVec(vec, camRight);
      return Math.atan2(xLocal, zLocal) * 180 / Math.PI;
    };

    const angleStart = getAngle(startPos);
    const virtualPos = [endPos[0], startPos[1], startPos[2]];
    const angleVirtual = getAngle(virtualPos);
    const angleEnd = getAngle(endPos);

    const courseChange = Math.abs(angleVirtual - angleStart);
    const trajectoryEffect = Math.abs(angleVirtual - angleEnd);
    const totalChange = courseChange + trajectoryEffect;

    return {
      total: totalChange,
      course: courseChange,
      trajectory: trajectoryEffect,
      courseRatio: totalChange > 0 ? (courseChange / totalChange) * 100 : 0,
      trajectoryRatio: totalChange > 0 ? (trajectoryEffect / totalChange) * 100 : 0,
      angleStart,
      angleEnd
    };
  };

  const handleHeightInputChange = (e) => {
    const inputValue = e.target.value;
    setBatterHeightInput(inputValue);
    
    if (inputValue === '') {
      setHeightError(null);
      return;
    }
    
    const value = parseInt(inputValue, 10);
    
    if (isNaN(value)) {
      setHeightError('数値を入力してください');
    } else if (value < HEIGHT_MIN || value > HEIGHT_MAX) {
      setHeightError(`対象外の身長です（${HEIGHT_MIN}〜${HEIGHT_MAX}cmの範囲で入力してください）`);
    } else {
      setHeightError(null);
      setBatterHeight(value);
    }
  };

  const handleHeightBlur = () => {
    if (heightError || batterHeightInput === '') {
      setBatterHeightInput(batterHeight.toString());
      setHeightError(null);
    }
  };

  useEffect(() => {
    const loadAndCalculate = async () => {
      if (heightError) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const csvPath = getCSVPath(batterHeight, selectedCourse, selectedPitch);
        const csvData = await loadCSV(csvPath);
        
        const safeC1Pos = boxPositions[condition1.position] ? condition1.position : 'inner';
        const safeC1Stance = stanceAngles[condition1.stance] !== undefined ? condition1.stance : 'open';
        
        const safeC2Pos = boxPositions[condition2.position] ? condition2.position : 'inner';
        const safeC2Stance = stanceAngles[condition2.stance] !== undefined ? condition2.stance : 'square';

        const c1Head = boxPositions[safeC1Pos];
        const c1Angle = stanceAngles[safeC1Stance];
        const c1EyesCalc = calculateEyePositions(c1Angle, c1Head);

        const c2Head = boxPositions[safeC2Pos];
        const c2Angle = stanceAngles[safeC2Stance];
        const c2EyesCalc = calculateEyePositions(c2Angle, c2Head);
        
        setEyePositions({ c1: c1EyesCalc, c2: c2EyesCalc });

        const results = csvData.map(row => {
          const ballPos = [row.x_m, row.y_m, row.z_m];
          
          const c1L = calculateVisualAngle(c1EyesCalc.leftEye, ballPos);
          const c1R = calculateVisualAngle(c1EyesCalc.rightEye, ballPos);
          const c1Disp = (c1L !== null && c1R !== null) ? c1L - c1R : 0.0001;

          const c2L = calculateVisualAngle(c2EyesCalc.leftEye, ballPos);
          const c2R = calculateVisualAngle(c2EyesCalc.rightEye, ballPos);
          const c2Disp = (c2L !== null && c2R !== null) ? c2L - c2R : 0.0001;
          
          const c1DispRad = c1Disp * Math.PI / 180;
          const c2DispRad = c2Disp * Math.PI / 180;
          
          const c1Error = (row.distance_m / c1DispRad) * STEREO_ACUITY_RAD * 100;
          const c2Error = (row.distance_m / c2DispRad) * STEREO_ACUITY_RAD * 100;

          return {
            time_s: row.time_s,
            time_ms: row.time_s * 1000,
            x_m: row.x_m,
            y_m: row.y_m,
            z_m: row.z_m,
            c1_disparity: c1Disp,
            c2_disparity: c2Disp,
            c1_error: c1Error,
            c2_error: c2Error,
            c1_visual_angle: c1R,
            c2_visual_angle: c2R,
            distance: row.distance_m
          };
        }).filter(d => d.distance > 0.05);
        
        setData(results);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadAndCalculate();
  }, [selectedPitch, selectedCourse, batterHeight, condition1, condition2, heightError]);

  const currentDetail = data.length > 0 ? 
    (data[selectedTimeIdx] || data[data.length - 1]) : null;

  const c1Decomposition = (data.length > 0 && eyePositions) 
    ? decomposeTrajectory(data, selectedTimeIdx, eyePositions.c1.rightEye) 
    : null;
    
  const c2Decomposition = (data.length > 0 && eyePositions) 
    ? decomposeTrajectory(data, selectedTimeIdx, eyePositions.c2.rightEye) 
    : null;

  const getPhaseLabel = (timeMs) => {
    if (timeMs < PHASE_TIMING.PERCEPTION_END) {
      return '視覚情報処理・タイミング知覚';
    }
    if (timeMs < PHASE_TIMING.SWING_START_MIN) {
      return '判断完了・スイング準備';
    }
    if (timeMs < PHASE_TIMING.SWING_START_MAX) {
      return 'スイング開始可能区間';
    }
    return '運動調整・スイング実行';
  };

  const getPhaseStyle = (timeMs) => {
    if (timeMs < PHASE_TIMING.PERCEPTION_END) {
      return 'bg-blue-100 text-blue-800';
    }
    if (timeMs < PHASE_TIMING.SWING_START_MIN) {
      return 'bg-cyan-100 text-cyan-800';
    }
    if (timeMs < PHASE_TIMING.SWING_START_MAX) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-red-100 text-red-800';
  };

  const getTickPosition = (timeMs) => {
    if (data.length === 0) return 0;
    const maxTime = data[data.length - 1].time_ms;
    const minTime = data[0].time_ms;
    return ((timeMs - minTime) / (maxTime - minTime)) * 100;
  };

  const handleSaveImage = async () => {
    if (!printRef.current) return;
    
    // 緑の線を一時的に非表示にする
    const timelineLines = printRef.current.querySelectorAll('.timeline-marker');
    timelineLines.forEach(el => {
      el.style.display = 'none';
    });
    
    try {
      const dataUrl = await toPng(printRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `analysis_${batterHeight}cm_${selectedCourse}_${selectedPitch}_${graphMode}.png`;
      link.click();
    } catch (error) {
      console.error('画像保存エラー:', error);
      alert('画像の保存に失敗しました');
    } finally {
      // 緑の線を再表示する
      timelineLines.forEach(el => {
        el.style.display = '';
      });
    }
  };

  const renderChart = () => {
    // 緑色のタイムライン位置線（画像保存時はfilterで除外される）
    const timelineReferenceLine = (
      <ReferenceLine 
        x={currentDetail?.time_ms} 
        stroke="#22c55e" 
        strokeDasharray="3 3" 
        strokeWidth={2}
        className="timeline-marker"
      />
    );

    if (graphMode === 'disparity') {
      return (
        <LineChart data={data} margin={{ top: 25, right: 30, bottom: 50, left: 70 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="time_ms" 
            ticks={timeTicks} 
            type="number" 
            domain={[0, 400]}
            tick={axisTick}
            tickLine={{ stroke: '#9ca3af' }}
            axisLine={{ stroke: '#9ca3af' }}
          >
            <Label value="経過時間 (ms)" position="bottom" offset={30} style={axisLabelStyle} />
          </XAxis>
          <YAxis 
            tick={axisTick}
            tickLine={{ stroke: '#9ca3af' }}
            axisLine={{ stroke: '#9ca3af' }}
            tickFormatter={(val) => val.toFixed(2)}
          >
            <Label value="両眼視差 (°)" position="left" angle={-90} offset={15} style={{ ...axisLabelStyle, textAnchor: 'middle' }} dy={-10} />
          </YAxis>
          <Tooltip 
            formatter={(val) => `${val.toFixed(4)}°`} 
            labelFormatter={(label) => `${label.toFixed(0)} ms`}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
          {/* {timelineReferenceLine} */}
          <Line type="monotone" dataKey="c1_disparity" name="Condition 1" stroke="#2563eb" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="c2_disparity" name="Condition 2" stroke="#f97316" strokeWidth={3} dot={false} />
        </LineChart>
      );
    }
    if (graphMode === 'accuracy') {
      return (
        <AreaChart data={data} margin={{ top: 25, right: 30, bottom: 50, left: 70 }}>
          <defs>
            <linearGradient id="colorC1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
            <linearGradient id="colorC2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="time_ms" 
            ticks={timeTicks} 
            type="number" 
            domain={[0, 400]}
            tick={axisTick}
            tickLine={{ stroke: '#9ca3af' }}
            axisLine={{ stroke: '#9ca3af' }}
          >
            <Label value="経過時間 (ms)" position="bottom" offset={30} style={axisLabelStyle} />
          </XAxis>
          <YAxis 
            domain={[0, 3000]} 
            ticks={errorTicks}
            tick={axisTick}
            tickLine={{ stroke: '#9ca3af' }}
            axisLine={{ stroke: '#9ca3af' }}
          >
            <Label value="認識誤差 (±cm)" position="left" angle={-90} offset={15} style={{ ...axisLabelStyle, textAnchor: 'middle' }} dy={-10} />
          </YAxis>
          <Tooltip 
            formatter={(val) => `±${val.toFixed(1)} cm`} 
            labelFormatter={(label) => `${label.toFixed(0)} ms`}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
          {/* {timelineReferenceLine} */}
          <Area type="monotone" dataKey="c1_error" name="Condition 1" stroke="#2563eb" fill="url(#colorC1)" strokeWidth={2} />
          <Area type="monotone" dataKey="c2_error" name="Condition 2" stroke="#f97316" fill="url(#colorC2)" strokeWidth={2} />
        </AreaChart>
      );
    }
    if (graphMode === 'trajectory') {
      return (
        <LineChart data={data} margin={{ top: 25, right: 30, bottom: 50, left: 70 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="time_ms" 
            type="number" 
            ticks={timeTicks} 
            domain={[0, 400]}
            tick={axisTick}
            tickLine={{ stroke: '#9ca3af' }}
            axisLine={{ stroke: '#9ca3af' }}
          >
            <Label value="経過時間 (ms)" position="bottom" offset={30} style={axisLabelStyle} />
          </XAxis>
          <YAxis 
            type="number" 
            domain={['auto', 'auto']}
            tick={axisTick}
            tickLine={{ stroke: '#9ca3af' }}
            axisLine={{ stroke: '#9ca3af' }}
            tickFormatter={(val) => val.toFixed(1)}
          >
            <Label value="水平視角 (°)" position="left" angle={-90} offset={15} style={{ ...axisLabelStyle, textAnchor: 'middle' }} dy={-10} />
          </YAxis>
          <Tooltip 
            cursor={{strokeDasharray: '3 3'}} 
            formatter={(val) => `${val.toFixed(2)}°`} 
            labelFormatter={(label) => `${label.toFixed(0)} ms`}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
          {/* {timelineReferenceLine} */}
          <Line type="monotone" dataKey="c1_visual_angle" name="Condition 1" stroke="#2563eb" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="c2_visual_angle" name="Condition 2" stroke="#f97316" strokeWidth={3} dot={false} />
        </LineChart>
      );
    }
  };

  const renderDecompositionStats = (result, colorClass, barColor) => {
    if (!result) return null;
    return (
      <div className="mt-2">
        <div className="flex justify-between items-end mb-2">
           <span className="text-xs text-gray-500 font-bold">視覚移動の内訳 (0ms → 現在)</span>
           <span className="text-3xl font-bold text-gray-800">{result.total.toFixed(2)}° <span className="text-xs font-normal text-gray-400">移動</span></span>
        </div>
        
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex mb-2">
          <div style={{ width: `${result.courseRatio}%` }} className={`h-full ${barColor} opacity-80`}></div>
          <div style={{ width: `${result.trajectoryRatio}%` }} className="h-full bg-gray-400 opacity-30"></div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
           <div className="bg-gray-50 p-2 rounded border border-gray-100">
              <div className="flex items-center gap-1 text-xm text-gray-500 mb-1">
                 <ArrowRightLeft size={15} /> コース変化
              </div>
              <div className={`text-2xl font-bold ${colorClass}` }>
                 {result.courseRatio.toFixed(1)}% <span className="text-xs text-gray-400">({result.course.toFixed(2)}°)</span>
              </div>
           </div>
           <div className="bg-gray-50 p-2 rounded border border-gray-100">
              <div className="flex items-center gap-1 text-xm text-gray-500 mb-1">
                 <ArrowUpCircle size={15} /> 球筋効果(奥行)
              </div>
              <div className="text-2xl font-bold text-gray-600">
                 {result.trajectoryRatio.toFixed(1)}% <span className="text-xs text-gray-400">({result.trajectory.toFixed(2)}°)</span>
              </div>
           </div>
        </div>
        {/* <p className="text-[10px] text-gray-400 mt-1 text-right">※Y座標固定時のX移動 vs 奥行移動</p> */}
      </div>
    );
  };

  const renderCourseGrid = () => {
    const grid = [
      ['high_in', 'high_mid', 'high_out'],
      ['mid_in', 'mid_mid', 'mid_out'],
      ['low_in', 'low_mid', 'low_out']
    ];
    
    const getShortLabel = (course) => {
      const labels = {
        'high_in': 'イン\n高め',
        'high_mid': '中\n高め',
        'high_out': 'アウト\n高め',
        'mid_in': 'イン\n中',
        'mid_mid': '真ん中',
        'mid_out': 'アウト\n中',
        'low_in': 'イン\n低め',
        'low_mid': '中\n低め',
        'low_out': 'アウト\n低め'
      };
      return labels[course] || course;
    };
    
    return (
      <div className="bg-gradient-to-b from-green-800 to-green-900 p-3 rounded-xl shadow-inner">
        <div className="grid grid-cols-3 gap-1">
          {grid.map((row, rowIdx) => (
            row.map((course, colIdx) => {
              const isSelected = selectedCourse === course;
              return (
                <button
                  key={course}
                  onClick={() => setSelectedCourse(course)}
                  className={`
                    aspect-square rounded-lg text-xs font-bold transition-all duration-200
                    flex items-center justify-center whitespace-pre-line text-center
                    ${isSelected 
                      ? 'bg-red-500 text-white shadow-lg scale-105 ring-2 ring-red-300' 
                      : 'bg-white/90 text-gray-700 hover:bg-yellow-100 hover:scale-102'
                    }
                  `}
                  style={{ minHeight: '52px' }}
                >
                  {getShortLabel(course)}
                </button>
              );
            })
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 bg-gray-50 font-sans">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2 md:mb-0 flex items-center gap-2">
            <BarChart2 className="w-8 h-8 text-indigo-600" />
            VR野球 視覚指標分析
          </h1>
          <button onClick={handleSaveImage} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg shadow transition-colors">
            <Camera className="w-5 h-5" /> <span>結果を画像保存</span>
          </button>
        </div>

        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            投球設定
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                バッター身長
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={HEIGHT_MIN}
                  max={HEIGHT_MAX}
                  value={batterHeightInput}
                  onChange={handleHeightInputChange}
                  onBlur={handleHeightBlur}
                  className={`w-24 px-3 py-2 border rounded-lg text-center font-mono text-lg font-bold focus:ring-2 focus:outline-none ${
                    heightError 
                      ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                <span className="text-gray-600 font-medium">cm</span>
              </div>
              {heightError ? (
                <p className="text-xs text-red-500 mt-1 font-medium">{heightError}</p>
              ) : (
                <div className="text-xs text-gray-400 mt-1">
                  <p>{HEIGHT_MIN}〜{HEIGHT_MAX}cmの範囲</p>
                  <p className="text-blue-500 font-medium">眼高: {(currentEyeHeight * 100).toFixed(1)}cm ({currentEyeHeight.toFixed(3)}m)</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-4">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-red-500" />
                コース: <span className="text-red-600">{courseOptions[selectedCourse].name}</span>
              </label>
              {renderCourseGrid()}
            </div>

            <div className="lg:col-span-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                球種
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(pitchTypes).map(([key, pitch]) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedPitch(key); setSelectedTimeIdx(Math.min(200, data.length - 1)); }}
                    className={`
                      px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2
                      ${selectedPitch === key 
                        ? 'text-white shadow-lg scale-102' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                    style={selectedPitch === key ? { backgroundColor: pitch.color } : {}}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pitch.color }}></span>
                    {pitch.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span> Condition 1 (基準)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-blue-600 mb-1">スタンス</label>
                <select className="w-full p-2 rounded border border-blue-200 text-sm" value={condition1.stance} onChange={(e) => setCondition1({...condition1, stance: e.target.value})}>
                  {Object.keys(stanceAngles).map(k => <option key={k} value={k}>{stanceLabels[k]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blue-600 mb-1">打席位置</label>
                <select className="w-full p-2 rounded border border-blue-200 text-sm" value={condition1.position} onChange={(e) => setCondition1({...condition1, position: e.target.value})}>
                  {Object.keys(boxPositions).map(k => <option key={k} value={k}>{positionLabels[k]}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span> Condition 2 (比較)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-orange-600 mb-1">スタンス</label>
                <select className="w-full p-2 rounded border border-orange-200 text-sm" value={condition2.stance} onChange={(e) => setCondition2({...condition2, stance: e.target.value})}>
                  {Object.keys(stanceAngles).map(k => <option key={k} value={k}>{stanceLabels[k]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-orange-600 mb-1">打席位置</label>
                <select className="w-full p-2 rounded border border-orange-200 text-sm" value={condition2.position} onChange={(e) => setCondition2({...condition2, position: e.target.value})}>
                  {Object.keys(boxPositions).map(k => <option key={k} value={k}>{positionLabels[k]}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div ref={printRef} className="bg-white p-4 rounded-xl border border-transparent">
          <div className="mb-4 text-center border-b pb-2">
             <h2 className="text-lg font-bold text-gray-700">
               {pitchTypes[selectedPitch].name} - {courseOptions[selectedCourse].name} (身長{batterHeight}cm)
             </h2>
             <p className="text-xs text-gray-500">
               Condition 1: {stanceLabels[condition1.stance]}/{positionLabels[condition1.position]} vs 
               Condition 2: {stanceLabels[condition2.stance]}/{positionLabels[condition2.position]}
             </p>
          </div>

          {error && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl mb-4">
              <div className="text-red-600 font-bold mb-2">データ読み込みエラー</div>
              <div className="text-red-500 text-sm">{error}</div>
              <div className="text-gray-500 text-xs mt-2">
                ファイルパス: ./public/{batterHeight}/{selectedCourse}/{selectedPitch}.csv
              </div>
            </div>
          )}

          {!error && !loading && data.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4 pb-4">
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setGraphMode('disparity')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center ${graphMode === 'disparity' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                    <TrendingUp className="w-4 h-4 mr-2" />両眼視差
                  </button>
                  <button onClick={() => setGraphMode('accuracy')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center ${graphMode === 'accuracy' ? 'bg-white text-rose-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                    <AlertTriangle className="w-4 h-4 mr-2" />認識誤差
                  </button>
                  <button onClick={() => setGraphMode('trajectory')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center ${graphMode === 'trajectory' ? 'bg-white text-emerald-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Eye className="w-4 h-4 mr-2" />視覚軌道
                  </button>
                </div>
              </div>
              
              <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {loading && !error && (
            <div className="h-[450px] w-full flex items-center justify-center">
              <div className="text-gray-500">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                データ読み込み中...
              </div>
            </div>
          )}

          {!error && !loading && currentDetail && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
               <div className="flex items-center justify-between mb-6">
                  <div>
                     <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${getPhaseStyle(currentDetail.time_ms)}`}>
                        {getPhaseLabel(currentDetail.time_ms)} ({currentDetail.time_ms.toFixed(0)}ms時点)
                     </span>
                     <p className="text-sm text-gray-500 mt-2">ボール距離: {currentDetail.distance.toFixed(2)}m</p>
                  </div>
               </div>

              <div className="w-full mb-8 px-2 relative">
                <div className="flex justify-between items-end mb-2">
                   <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                     <MousePointer2 className="w-4 h-4"/> 
                     タイムライン位置
                   </label>
                   <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">Frame: {selectedTimeIdx}</span>
                </div>
                <input type="range" min="0" max={data.length - 1} value={selectedTimeIdx} onChange={(e) => setSelectedTimeIdx(Number(e.target.value))} className="w-full h-6 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 relative z-10" />
                <div className="relative w-full h-6 mt-2 text-xs text-gray-500 font-medium">
                  <div className="absolute transform -translate-x-0" style={{left: '0%'}}>0ms</div>
                  {data.length > 0 && data[data.length-1].time_ms > PHASE_TIMING.PERCEPTION_END && (
                     <div className="absolute transform -translate-x-1/2 text-center text-blue-600 font-bold" style={{left: `${getTickPosition(PHASE_TIMING.PERCEPTION_END)}%`}}>150ms</div>
                  )}
                  {data.length > 0 && data[data.length-1].time_ms > PHASE_TIMING.SWING_START_MAX && (
                     <div className="absolute transform -translate-x-1/2 text-center text-red-600 font-bold" style={{left: `${getTickPosition(PHASE_TIMING.SWING_START_MAX)}%`}}>290ms</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-gray-600">Condition 1 (基準)</h4>
                  </div>
                  
                  {graphMode === 'trajectory' ? (
                     renderDecompositionStats(c1Decomposition, "text-blue-600", "bg-blue-600")
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-sm text-black-400 mb-1">両眼視差</p><p className="text-3xl font-bold text-slate-800">{currentDetail.c1_disparity.toFixed(4)}°</p></div>
                      <div><p className="text-sm text-black-400 mb-1">認識誤差</p><p className="text-3xl font-bold text-blue-600">±{currentDetail.c1_error.toFixed(1)} cm</p></div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
                  <div className="flex justify-between items-start mb-4">
                     <h4 className="font-bold text-gray-600">Condition 2 (比較)</h4>
                  </div>

                  {graphMode === 'trajectory' ? (
                     renderDecompositionStats(c2Decomposition, "text-orange-600", "bg-orange-500")
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-sm text-black-400 mb-1">両眼視差</p><p className="text-3xl font-bold text-slate-800">{currentDetail.c2_disparity.toFixed(4)}°</p></div>
                        <div><p className="text-sm text-black-400 mb-1">認識誤差</p><p className="text-3xl font-bold text-orange-600">±{currentDetail.c2_error.toFixed(1)} cm</p></div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 text-lg">
                        {currentDetail.c2_error > currentDetail.c1_error ? (
                          <div className="flex items-center text-red-600 font-bold"><TrendingUp className="w-4 h-4 mr-2" />誤差 {((currentDetail.c2_error / currentDetail.c1_error - 1) * 100).toFixed(1)}% 拡大</div>
                        ) : (
                          <div className="flex items-center text-green-600 font-bold"><TrendingUp className="w-4 h-4 mr-2" transform="scale(1, -1)" />誤差 {((1 - currentDetail.c2_error / currentDetail.c1_error) * 100).toFixed(1)}% 縮小</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisparityAndAccuracyAnalysis;