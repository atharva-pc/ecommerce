import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Toaster } from 'sonner';
import { motion } from 'motion/react';

export function PublicLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-[#F8F9FB]">
            <Header />
            <main className="flex-1 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <Outlet />
                </motion.div>
            </main>
            <Footer />
            <Toaster />
        </div>
    );
}
