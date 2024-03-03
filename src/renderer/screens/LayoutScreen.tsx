import { Aperture, ApertureIcon } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';

export default function LayoutScreen() {
	return (
		<div className="p-10 flex flex-wrap gap-10">
			<div className="sidebar w-[15%]">
				<div className="logo text-whiteText font-bold text-2xl">
					Tools All In One
				</div>
				<ul className="list-menu mt-5 flex flex-col gap-3">
					<NavLink
						to="/"
						className="flex items-center text-whiteText gap-3 px-4 py-2 rounded-3xl hover:bg-foreground transition-all"
					>
						<ApertureIcon />
						<span>Compress Image</span>
					</NavLink>
					<NavLink
						to="/config"
						className="flex items-center text-whiteText gap-3 px-4 py-2 rounded-3xl hover:bg-foreground transition-all"
					>
						<ApertureIcon />
						<span>Profile</span>
					</NavLink>
				</ul>
			</div>
			<div className="outlet flex-1">
				<Outlet></Outlet>
			</div>
		</div>
	);
}
