export default function Home() {
  return (
    <div className="w-screen h-screen bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
      <div className="max-w-4xl w-full text-center bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-8 shadow-xl mx-4">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-white drop-shadow-lg">
          欢迎来到我的个人网站
        </h1>
        <p className="text-lg md:text-xl mb-6 text-white drop-shadow-sm">
          这里展示我的作品、照片和视频。探索更多，发现创意与灵感。
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/photos"
            className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-full shadow-lg hover:bg-purple-50 hover:scale-105 transition transform"
          >
            查看作品
          </a>
          {/* <a
            href="#about"
            className="px-6 py-3 border border-white font-semibold rounded-full hover:bg-white hover:text-purple-600 transition transform"
          >
            关于我
          </a> */}
        </div>
      </div>
    </div>
  );
}
