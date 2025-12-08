#!/usr/bin/env python3
import os
import sys

def play_sound(sound_file_path):
    if sys.platform == "darwin":  # macOS
        os.system(f"afplay {sound_file_path}")
    elif sys.platform == "linux":  # Linux
        os.system(f"aplay {sound_file_path}")
    elif sys.platform == "win32":  # Windows
        # Use a simple built-in sound (requires PowerShell BurntToast module setup for custom sounds)
        # Or you can use a python library for cross-platform support.
        print("Playing sounds on Windows is more complex with system commands. Consider using a library like `playsound` or `pyttsx3`.")
        pass
    else:
        print(f"Platform {sys.platform} not supported for direct OS command sound playback.")

if __name__ == "__main__":
    # Replace with the actual path to your sound file (e.g., a .wav or .aiff file)
    # Ensure you use absolute paths as recommended for hooks.
    sound_path = "/System/Library/Sounds/Blow.aiff" # Example for macOS
    play_sound(sound_path)

