package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
)

func main() {
	mux := http.NewServeMux()

	// Handle search endpoints first (more specific)
	mux.HandleFunc("/search-usnc/", handleSearch("https://azuresearch-usnc.nuget.org", "/search-usnc"))
	mux.HandleFunc("/search-ussc/", handleSearch("https://azuresearch-ussc.nuget.org", "/search-ussc"))

	// Handle all other requests
	mux.HandleFunc("/", handleProxy)

	log.Println("NuGet proxy on https://localhost:5555")
	log.Fatal(http.ListenAndServeTLS(":5555", "cert.pem", "key.pem", mux))
}

func handleProxy(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	query := r.URL.RawQuery

	targetURL := "https://api.nuget.org" + path
	if query != "" {
		targetURL += "?" + query
	}

	log.Printf("-> %s %s", r.Method, path)

	req, err := http.NewRequest(r.Method, targetURL, r.Body)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	for k, v := range r.Header {
		lk := strings.ToLower(k)
		if lk != "host" && lk != "accept-encoding" {
			req.Header[k] = v
		}
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Error: %v", err)
		http.Error(w, err.Error(), 502)
		return
	}
	defer resp.Body.Close()

	// Copy response headers (except Content-Length which might change for JSON)
	for k, v := range resp.Header {
		lk := strings.ToLower(k)
		if lk != "content-encoding" {
			w.Header()[k] = v
		}
	}

	// Check if this is a JSON response that needs URL rewriting
	contentType := resp.Header.Get("Content-Type")
	isJSON := strings.Contains(contentType, "json") || strings.HasSuffix(path, ".json")

	if isJSON {
		body, _ := io.ReadAll(resp.Body)

		// Rewrite NuGet URLs to use local proxy
		bodyStr := string(body)
		bodyStr = strings.ReplaceAll(bodyStr, "https://api.nuget.org", "https://localhost:5555")
		bodyStr = strings.ReplaceAll(bodyStr, "https://azuresearch-usnc.nuget.org", "https://localhost:5555/search-usnc")
		bodyStr = strings.ReplaceAll(bodyStr, "https://azuresearch-ussc.nuget.org", "https://localhost:5555/search-ussc")
		body = []byte(bodyStr)

		w.Header().Set("Content-Length", fmt.Sprintf("%d", len(body)))
		w.WriteHeader(resp.StatusCode)
		w.Write(body)
		log.Printf("<- %d JSON (%d bytes)", resp.StatusCode, len(body))
	} else {
		// Binary content - stream directly without modification
		w.WriteHeader(resp.StatusCode)
		n, _ := io.Copy(w, resp.Body)
		log.Printf("<- %d BINARY (%d bytes)", resp.StatusCode, n)
	}
}

func handleSearch(baseURL, prefix string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, prefix)
		targetURL := baseURL + path
		if r.URL.RawQuery != "" {
			targetURL += "?" + r.URL.RawQuery
		}

		log.Printf("-> SEARCH %s", targetURL)

		req, _ := http.NewRequest(r.Method, targetURL, r.Body)
		for k, v := range r.Header {
			if strings.ToLower(k) != "host" && strings.ToLower(k) != "accept-encoding" {
				req.Header[k] = v
			}
		}

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			http.Error(w, err.Error(), 502)
			return
		}
		defer resp.Body.Close()

		for k, v := range resp.Header {
			if strings.ToLower(k) != "content-encoding" {
				w.Header()[k] = v
			}
		}

		// Search results are JSON - rewrite URLs
		body, _ := io.ReadAll(resp.Body)
		bodyStr := string(body)
		bodyStr = strings.ReplaceAll(bodyStr, "https://api.nuget.org", "https://localhost:5555")
		bodyStr = strings.ReplaceAll(bodyStr, "https://azuresearch-usnc.nuget.org", "https://localhost:5555/search-usnc")
		bodyStr = strings.ReplaceAll(bodyStr, "https://azuresearch-ussc.nuget.org", "https://localhost:5555/search-ussc")
		body = []byte(bodyStr)

		w.Header().Set("Content-Length", fmt.Sprintf("%d", len(body)))
		w.WriteHeader(resp.StatusCode)
		w.Write(body)
		log.Printf("<- SEARCH %d (%d bytes)", resp.StatusCode, len(body))
	}
}
