import { Toaster } from 'react-hot-toast';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
// eslint-disable-next-line import/no-cycle
import CompressImages from './screens/compress-image/compress-image';
import LayoutScreen from './screens/LayoutScreen';

export default function App() {
	return (
		<>
			<Router>
				<Routes>
					<Route path="/" element={<LayoutScreen />}>
						<Route index element={<CompressImages />} />
						<Route path="/config" element={<>123</>} />
					</Route>
				</Routes>
			</Router>
			<Toaster position="top-right"/>
		</>
	);
}
