"use client"

import { useState, useEffect, useCallback } from "react"

export const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices()
            setVoices(availableVoices)

            // Intentar trobar una veu en català o espanyol per defecte, o una de Google
            const preferredVoice = availableVoices.find(
                (voice) => voice.lang.includes("ca-ES") || voice.lang.includes("es-ES")
            )

            if (preferredVoice) {
                setSelectedVoice(preferredVoice)
            } else if (availableVoices.length > 0) {
                setSelectedVoice(availableVoices[0]) // Fallback a la primera
            }
        }

        loadVoices()

        // Chrome carrega les veus de forma asíncrona
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices
        }
    }, [])

    const speak = useCallback((text: string) => {
        if (!("speechSynthesis" in window)) {
            console.error("Aquest navegador no suporta síntesi de veu.")
            return
        }

        // Aturar si ja està parlant per evitar solapaments
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)

        if (selectedVoice) {
            utterance.voice = selectedVoice
        }

        utterance.rate = 1 // Velocitat normal
        utterance.pitch = 1 // To normal

        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)

        window.speechSynthesis.speak(utterance)
    }, [selectedVoice])

    const stop = useCallback(() => {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
    }, [])

    return { speak, stop, isSpeaking, voices, selectedVoice, setSelectedVoice }
}
