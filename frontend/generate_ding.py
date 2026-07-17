import wave
import struct
import math

filename = "public/ding.wav"
sample_rate = 44100
duration = 0.3
frequency = 880.0

with wave.open(filename, 'w') as wav_file:
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2)
    wav_file.setframerate(sample_rate)
    
    for i in range(int(sample_rate * duration)):
        t = float(i) / sample_rate
        # Create a nice decaying sine wave (ding sound)
        envelope = math.exp(-10 * t)
        value = int(32767.0 * envelope * math.sin(2.0 * math.pi * frequency * t))
        data = struct.pack('<h', value)
        wav_file.writeframesraw(data)

print("Generated ding.wav!")
