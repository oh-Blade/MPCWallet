CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2
TARGET = mpc_wallet_server
SOURCE = mpc_server.cpp

all: $(TARGET)

$(TARGET): $(SOURCE)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SOURCE)

clean:
	rm -f $(TARGET)

install:
	chmod +x $(TARGET)

run: $(TARGET)
	./$(TARGET)

.PHONY: all clean install run 