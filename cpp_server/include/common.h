#pragma once

#include <string>
#include <memory>
#include <vector>
#include <unordered_map>
#include <functional>
#include <iostream>
#include <chrono>
#include <thread>
#include <mutex>
#include <regex>

// 前向声明或简化版本的HTTP处理
namespace http {
    struct Request {
        std::string method;
        std::string path;
        std::unordered_map<std::string, std::string> headers;
        std::string body;
        std::unordered_map<std::string, std::string> params;
    };

    struct Response {
        int status = 200;
        std::unordered_map<std::string, std::string> headers;
        std::string body;
        
        void set_header(const std::string& key, const std::string& value) {
            headers[key] = value;
        }
        
        void set_content(const std::string& content, const std::string& content_type) {
            body = content;
            headers["Content-Type"] = content_type;
        }
    };

    using Handler = std::function<void(const Request&, Response&)>;
}

// 简化的JSON处理
namespace json {
    class Value {
    public:
        enum Type { Null, Bool, Number, String, Array, Object };
        
        Value() : type_(Null) {}
        Value(bool b) : type_(Bool), bool_val_(b) {}
        Value(double d) : type_(Number), number_val_(d) {}
        Value(const std::string& s) : type_(String), string_val_(s) {}
        
        Type type() const { return type_; }
        
        // 简化的操作符
        Value& operator[](const std::string& key);
        const Value& operator[](const std::string& key) const;
        
        std::string dump() const;
        static Value parse(const std::string& str);
        
    private:
        Type type_;
        bool bool_val_ = false;
        double number_val_ = 0.0;
        std::string string_val_;
        std::unordered_map<std::string, Value> object_val_;
        std::vector<Value> array_val_;
    };
} 