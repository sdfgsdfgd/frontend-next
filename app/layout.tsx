import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import './globals.css'
import React from "react";

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
    title: 'Arcana, an Agentic App',
    description: 'Agentic multi-round codebase comprehension & refactoring',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body
            className={`${inter.className} bg-gray-900 text-gray-100`}
            // Above: sets a default dark background & text color for the entire app
        >
        <div className="flex min-h-screen">
            {/* SIDEBAR */}
            <aside className="hidden md:block w-64 bg-gray-800 p-6">
                {/*
              Later you can add expand/collapse logic or a button to toggle this
              For now, it's a static sidebar that only shows on medium+ screens
            */}
                <nav>
                    <ul className="space-y-2">
                        <li className="text-gray-300 hover:text-white transition">Item 1</li>
                        <li className="text-gray-300 hover:text-white transition">Item 2</li>
                        <li className="text-gray-300 hover:text-white transition">Item 3</li>
                    </ul>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col">
                {children}
            </main>
        </div>
        </body>
        </html>
    )
}
