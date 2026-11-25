package com.learnsphere.controller;

import com.learnsphere.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private AIService aiService;

    @PostMapping("/explain")
    public ResponseEntity<?> explainConcept(@RequestBody Map<String, String> request) {
        String concept = request.get("concept");
        String explanation = aiService.generateExplanation(concept);
        return ResponseEntity.ok(Map.of("explanation", explanation));
    }

    @PostMapping("/study-plan")
    public ResponseEntity<?> generateStudyPlan(@RequestBody Map<String, String> request) {
        String topic = request.get("topic");
        String plan = aiService.generateStudyPlan(topic);
        return ResponseEntity.ok(Map.of("studyPlan", plan));
    }
}
