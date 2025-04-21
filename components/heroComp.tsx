"use client"

import ChatPage from "./chatComp";
// import MainLogoIcon from "./ui/logosvg copy";



const Hero: React.FC = () => {
    return <>
        <div className="absolute top-4 left-2">
            {/* <img src="/logo2.png" alt="" /> */}
            {/* <MainLogoIcon /> */}
        </div>
        <ChatPage />
    </>
}

export default Hero;
