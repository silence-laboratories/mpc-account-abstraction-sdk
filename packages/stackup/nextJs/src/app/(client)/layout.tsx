"use client";
import React, { useEffect, useState } from "react";
import { useSwitchScreen } from "@/hooks/useSwitchScreen";

const Layout = ({ children }: { children: React.ReactNode }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    useSwitchScreen();


    return isClient ? children : null;
};

export default Layout;
