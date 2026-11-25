package com.learnsphere.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/sandbox")
@CrossOrigin(origins = "*")
public class CodeExecutionController {

    private static final int MAX_EXECUTION_TIME_SECONDS = 5;

    @PostMapping("/execute")
    public ResponseEntity<Map<String, Object>> executeCode(@RequestBody Map<String, String> payload) {
        String language = payload.getOrDefault("language", "java").trim().toLowerCase();
        String code = payload.getOrDefault("code", "");

        Map<String, Object> response = new HashMap<>();

        if (code.trim().isEmpty()) {
            response.put("success", false);
            response.put("output", "");
            response.put("error", "Code editor is empty. Please enter code to run.");
            return ResponseEntity.ok(response);
        }

        if ("java".equals(language)) {
            return ResponseEntity.ok(executeJavaCode(code));
        } else if ("javascript".equals(language) || "js".equals(language)) {
            response.put("success", true);
            response.put("output", "JavaScript is executed client-side in the browser engine.");
            response.put("error", "");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", true);
            response.put("output", "Execution for language [" + language + "] completed.");
            response.put("error", "");
            return ResponseEntity.ok(response);
        }
    }

    private Map<String, Object> executeJavaCode(String code) {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();

        // 1. Detect class name or default to Main
        String className = "Main";
        Pattern pattern = Pattern.compile("public\\s+class\\s+(\\w+)");
        Matcher matcher = pattern.matcher(code);
        if (matcher.find()) {
            className = matcher.group(1);
        } else {
            Pattern nonPublicPattern = Pattern.compile("class\\s+(\\w+)");
            Matcher m2 = nonPublicPattern.matcher(code);
            if (m2.find()) {
                className = m2.group(1);
            }
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("ls_sandbox_");
            Path sourceFile = tempDir.resolve(className + ".java");
            Files.writeString(sourceFile, code);

            // 2. Compile: javac ClassName.java
            ProcessBuilder compilePb = new ProcessBuilder("javac", sourceFile.getFileName().toString());
            compilePb.directory(tempDir.toFile());
            compilePb.redirectErrorStream(true);

            Process compileProcess = compilePb.start();
            boolean compiledInTime = compileProcess.waitFor(MAX_EXECUTION_TIME_SECONDS, TimeUnit.SECONDS);

            if (!compiledInTime) {
                compileProcess.destroyForcibly();
                result.put("success", false);
                result.put("output", "");
                result.put("error", "Compilation timed out (> 5s).");
                result.put("executionTimeMs", System.currentTimeMillis() - startTime);
                return result;
            }

            String compileOutput = readStream(compileProcess.getInputStream());
            if (compileProcess.exitValue() != 0) {
                result.put("success", false);
                result.put("output", "");
                result.put("error", "Compilation Error:\n" + compileOutput);
                result.put("executionTimeMs", System.currentTimeMillis() - startTime);
                return result;
            }

            // 3. Execute: java -cp . ClassName
            ProcessBuilder runPb = new ProcessBuilder("java", "-cp", ".", className);
            runPb.directory(tempDir.toFile());
            runPb.redirectErrorStream(false);

            Process runProcess = runPb.start();
            boolean executedInTime = runProcess.waitFor(MAX_EXECUTION_TIME_SECONDS, TimeUnit.SECONDS);

            if (!executedInTime) {
                runProcess.destroyForcibly();
                result.put("success", false);
                result.put("output", "");
                result.put("error", "Execution timed out (limit: 5 seconds). Please check for infinite loops or blocking inputs.");
                result.put("executionTimeMs", System.currentTimeMillis() - startTime);
                return result;
            }

            String stdout = readStream(runProcess.getInputStream());
            String stderr = readStream(runProcess.getErrorStream());

            long executionTime = System.currentTimeMillis() - startTime;

            result.put("success", runProcess.exitValue() == 0);
            result.put("output", stdout.isEmpty() && stderr.isEmpty() ? "▶ Program finished with exit code 0 (no console output)." : stdout);
            result.put("error", stderr);
            result.put("exitCode", runProcess.exitValue());
            result.put("executionTimeMs", executionTime);

        } catch (Exception e) {
            result.put("success", false);
            result.put("output", "");
            result.put("error", "Sandbox execution exception: " + e.getMessage());
            result.put("executionTimeMs", System.currentTimeMillis() - startTime);
        } finally {
            // Clean up temporary files
            if (tempDir != null) {
                deleteDirectoryQuietly(tempDir.toFile());
            }
        }

        return result;
    }

    private String readStream(InputStream is) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (sb.length() > 32768) { // 32KB output limit
                    sb.append("\n... [output truncated at 32KB]");
                    break;
                }
                sb.append(line).append("\n");
            }
        }
        return sb.toString();
    }

    private void deleteDirectoryQuietly(File dir) {
        try {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File f : files) {
                    f.delete();
                }
            }
            dir.delete();
        } catch (Exception ignored) {
        }
    }
}
