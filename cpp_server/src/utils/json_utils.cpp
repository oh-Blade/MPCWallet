#include "../../include/common.h"
#include <sstream>

namespace json {

Value& Value::operator[](const std::string& key) {
    if (type_ != Object) {
        type_ = Object;
        object_val_.clear();
    }
    return object_val_[key];
}

const Value& Value::operator[](const std::string& key) const {
    static Value null_value;
    if (type_ != Object) return null_value;
    auto it = object_val_.find(key);
    return it != object_val_.end() ? it->second : null_value;
}

std::string Value::dump() const {
    switch (type_) {
        case Null:
            return "null";
        case Bool:
            return bool_val_ ? "true" : "false";
        case Number:
            return std::to_string(number_val_);
        case String:
            return "\"" + string_val_ + "\"";
        case Array: {
            std::ostringstream oss;
            oss << "[";
            for (size_t i = 0; i < array_val_.size(); ++i) {
                if (i > 0) oss << ",";
                oss << array_val_[i].dump();
            }
            oss << "]";
            return oss.str();
        }
        case Object: {
            std::ostringstream oss;
            oss << "{";
            bool first = true;
            for (const auto& pair : object_val_) {
                if (!first) oss << ",";
                first = false;
                oss << "\"" << pair.first << "\":" << pair.second.dump();
            }
            oss << "}";
            return oss.str();
        }
    }
    return "null";
}

Value Value::parse(const std::string& str) {
    // 简化的JSON解析器实现
    // 这里只是一个基本实现，生产环境应该使用更完整的JSON库
    Value result;
    if (str == "true") {
        result = Value(true);
    } else if (str == "false") {
        result = Value(false);
    } else if (str == "null") {
        result = Value();
    } else if (str.front() == '"' && str.back() == '"') {
        result = Value(str.substr(1, str.length() - 2));
    } else {
        try {
            double num = std::stod(str);
            result = Value(num);
        } catch (...) {
            result = Value(str); // 作为字符串处理
        }
    }
    return result;
}

} 