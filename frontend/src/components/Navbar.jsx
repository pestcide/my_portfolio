import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

export default function Navbar() {
  const location = useLocation();

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const listRef = useRef(null);
  const itemRefs = useRef({});

  // 更新条状小圆点位置和宽度
  const updateIndicator = (path) => {
    const el = itemRefs.current[path];
    const parent = listRef.current;

    if (!el || !parent) return;

    const rect = el.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    setIndicatorStyle({
      left: rect.left - parentRect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    updateIndicator(location.pathname);

    const handleResize = () => updateIndicator(location.pathname);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [location]);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Photos", path: "/photos" },
    { name: "Videos", path: "/videos" },
  ];

  return (
    <NavigationMenu
      className="fixed top-6 left-1/2 -translate-x-1/2
        bg-white/80 backdrop-blur-lg border border-white/30 shadow-md
        rounded-3xl px-6 py-3"
    >
      <NavigationMenuList ref={listRef} className="relative flex gap-8">

        {navItems.map((item) => (
          <NavigationMenuItem key={item.path}>
            <NavigationMenuLink
              asChild
              ref={(el) => (itemRefs.current[item.path] = el)}
              onMouseEnter={() => updateIndicator(item.path)}
              onMouseLeave={() => updateIndicator(location.pathname)}
            >
              <Link
                to={item.path}
                className="
                  relative text-base font-semibold text-gray-700
                  hover:text-gray-900 transition-colors duration-200
                  px-1 py-1
                "
              >
                {item.name}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}

        {/* 条状小圆点，宽度和文字一致 */}
        <div
          className="absolute bottom-0 h-1 rounded-full bg-blue-500 transition-all duration-300 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            transform: "translateY(2px)", // 贴近文字底部
          }}
        />
      </NavigationMenuList>
    </NavigationMenu>
  );
}
