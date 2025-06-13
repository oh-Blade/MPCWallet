# 变量定义
BINARY_NAME=mpc-wallet
BUILD_DIR=build
CONFIG_DIR=config
SCRIPTS_DIR=scripts

# 默认目标
.PHONY: all
all: clean build

# 清理构建文件
.PHONY: clean
clean:
	@echo "清理构建文件..."
	@rm -rf $(BUILD_DIR)
	@rm -f $(BINARY_NAME)
	@echo "清理完成"

# 安装依赖
.PHONY: deps
deps:
	@echo "安装依赖..."
	@go mod download
	@echo "依赖安装完成"

# 运行测试
.PHONY: test
test:
	@echo "运行测试..."
	@go test -v ./...
	@echo "测试完成"

# 构建项目
.PHONY: build
build: deps
	@echo "构建项目..."
	@mkdir -p $(BUILD_DIR)
	@go build -o $(BUILD_DIR)/$(BINARY_NAME)
	@echo "构建完成"

# 运行项目
.PHONY: run
run: build
	@echo "启动服务..."
	@./$(BUILD_DIR)/$(BINARY_NAME)

# 启动服务（后台运行）
.PHONY: start
start: build
	@echo "启动服务（后台运行）..."
	@./$(SCRIPTS_DIR)/start.sh

# 停止服务
.PHONY: stop
stop:
	@echo "停止服务..."
	@./$(SCRIPTS_DIR)/stop.sh

# 重启服务
.PHONY: restart
restart: stop start

# 检查代码格式
.PHONY: fmt
fmt:
	@echo "格式化代码..."
	@go fmt ./...
	@echo "格式化完成"

# 运行代码检查
.PHONY: lint
lint:
	@echo "运行代码检查..."
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run; \
	else \
		echo "未找到 golangci-lint，跳过代码检查"; \
	fi

# 生成配置文件
.PHONY: config
config:
	@echo "生成配置文件..."
	@if [ ! -f "$(CONFIG_DIR)/config.yaml" ]; then \
		cp $(CONFIG_DIR)/config.yaml.example $(CONFIG_DIR)/config.yaml; \
		echo "配置文件已生成，请修改 $(CONFIG_DIR)/config.yaml"; \
	else \
		echo "配置文件已存在"; \
	fi

# 帮助信息
.PHONY: help
help:
	@echo "可用的命令:"
	@echo "  make        - 清理并构建项目"
	@echo "  make clean  - 清理构建文件"
	@echo "  make deps   - 安装依赖"
	@echo "  make test   - 运行测试"
	@echo "  make build  - 构建项目"
	@echo "  make run    - 构建并运行项目"
	@echo "  make start  - 构建并在后台启动服务"
	@echo "  make stop   - 停止服务"
	@echo "  make restart- 重启服务"
	@echo "  make fmt    - 格式化代码"
	@echo "  make lint   - 运行代码检查"
	@echo "  make config - 生成配置文件"
	@echo "  make help   - 显示帮助信息" 