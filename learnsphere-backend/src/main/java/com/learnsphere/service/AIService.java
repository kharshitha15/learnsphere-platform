package com.learnsphere.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

@Service
public class AIService {

    @Value("${ai.api.key:mock}")
    private String apiKey;

    public String generateExplanation(String concept) {
        if ("mock".equals(apiKey)) {
            return "Mock AI Explanation: " + concept + " is a foundational concept in computer science. " +
                   "It involves understanding the underlying mechanics of the topic to apply it effectively in software development.";
        }
        // TODO: Integrate actual AI provider (e.g., Gemini) HTTP call here
        return "Real AI response for: " + concept;
    }

    public String generateStudyPlan(String topic) {
        return "Study Plan for " + topic + ":\n" +
               "1. Understand the basics (Days 1-2)\n" +
               "2. Practice core problems (Days 3-5)\n" +
               "3. Build a mini-project (Days 6-7)";
    }
}
