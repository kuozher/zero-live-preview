Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "node.exe """ & WScript.Arguments(0) & """", 0, False
