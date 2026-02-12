export const questions = {
  os: [
    {
      id: 1,
      question: "Which of the following is NOT a function of an Operating System?",
      options: [
        "Memory Management",
        "Process Management",
        "Database Management",
        "File System Management"
      ],
      correct: 2
    },
    {
      id: 2,
      question: "What is a deadlock in operating systems?",
      options: [
        "A situation where a process is terminated",
        "A situation where processes are blocked forever",
        "A type of scheduling algorithm",
        "A memory allocation error"
      ],
      correct: 1
    },
    {
      id: 3,
      question: "Which scheduling algorithm gives minimum average waiting time?",
      options: [
        "FCFS",
        "SJF",
        "Round Robin",
        "Priority Scheduling"
      ],
      correct: 1
    },
    {
      id: 4,
      question: "Virtual memory is:",
      options: [
        "A type of RAM",
        "A memory management technique",
        "A secondary storage device",
        "A CPU register"
      ],
      correct: 1
    },
    {
      id: 5,
      question: "Which of the following is a real-time operating system?",
      options: [
        "Windows 10",
        "Linux",
        "VxWorks",
        "macOS"
      ],
      correct: 2
    },
    {
      id: 6,
      question: "What is the purpose of a page table in virtual memory?",
      options: [
        "To store process data",
        "To map virtual addresses to physical addresses",
        "To manage file permissions",
        "To schedule processes"
      ],
      correct: 1
    },
    {
      id: 7,
      question: "Which of the following is a preemptive scheduling algorithm?",
      options: [
        "FCFS",
        "SJF (non-preemptive)",
        "Round Robin",
        "Priority (non-preemptive)"
      ],
      correct: 2
    },
    {
      id: 8,
      question: "What is a semaphore in operating systems?",
      options: [
        "A data structure for synchronization",
        "A type of file system",
        "A memory allocation unit",
        "A scheduling queue"
      ],
      correct: 0
    },
    {
      id: 9,
      question: "Which of the following is NOT a state of a process?",
      options: [
        "Ready",
        "Running",
        "Blocked",
        "Compiling"
      ],
      correct: 3
    },
    {
      id: 10,
      question: "What is thrashing in operating systems?",
      options: [
        "High CPU utilization",
        "Excessive paging due to insufficient memory",
        "Network congestion",
        "Disk failure"
      ],
      correct: 1
    }
  ],
  computerNetworks: [
    {
      id: 1,
      question: "Which layer of the OSI model is responsible for routing?",
      options: [
        "Data Link Layer",
        "Network Layer",
        "Transport Layer",
        "Application Layer"
      ],
      correct: 1
    },
    {
      id: 2,
      question: "What is the default port number for HTTP?",
      options: [
        "80",
        "443",
        "21",
        "25"
      ],
      correct: 0
    },
    {
      id: 3,
      question: "Which protocol is used for secure communication over the internet?",
      options: [
        "HTTP",
        "FTP",
        "HTTPS",
        "Telnet"
      ],
      correct: 2
    },
    {
      id: 4,
      question: "What is the purpose of DNS?",
      options: [
        "To assign IP addresses",
        "To resolve domain names to IP addresses",
        "To route packets",
        "To encrypt data"
      ],
      correct: 1
    },
    {
      id: 5,
      question: "Which of the following is a connection-oriented protocol?",
      options: [
        "UDP",
        "TCP",
        "IP",
        "ICMP"
      ],
      correct: 1
    },
    {
      id: 6,
      question: "What is the maximum length of an Ethernet frame?",
      options: [
        "64 bytes",
        "1518 bytes",
        "65536 bytes",
        "1024 bytes"
      ],
      correct: 1
    },
    {
      id: 7,
      question: "Which device operates at the Data Link Layer?",
      options: [
        "Router",
        "Switch",
        "Gateway",
        "Hub"
      ],
      correct: 1
    },
    {
      id: 8,
      question: "What is the purpose of ARP?",
      options: [
        "To resolve IP addresses to MAC addresses",
        "To resolve domain names",
        "To route packets",
        "To encrypt data"
      ],
      correct: 0
    },
    {
      id: 9,
      question: "Which of the following is a private IP address range?",
      options: [
        "192.168.0.0/16",
        "8.8.8.8",
        "1.1.1.1",
        "172.32.0.0/16"
      ],
      correct: 0
    },
    {
      id: 10,
      question: "What is the main difference between TCP and UDP?",
      options: [
        "TCP is faster than UDP",
        "TCP is connection-oriented, UDP is connectionless",
        "UDP is more reliable than TCP",
        "TCP uses more bandwidth than UDP"
      ],
      correct: 1
    }
  ],
  dsa: [
    {
      id: 1,
      question: "What is the time complexity of binary search?",
      options: [
        "O(n)",
        "O(log n)",
        "O(n²)",
        "O(1)"
      ],
      correct: 1
    },
    {
      id: 2,
      question: "Which data structure uses LIFO principle?",
      options: [
        "Queue",
        "Stack",
        "Array",
        "Linked List"
      ],
      correct: 1
    },
    {
      id: 3,
      question: "What is the worst-case time complexity of quicksort?",
      options: [
        "O(n log n)",
        "O(n²)",
        "O(n)",
        "O(log n)"
      ],
      correct: 1
    },
    {
      id: 4,
      question: "Which of the following is a linear data structure?",
      options: [
        "Tree",
        "Graph",
        "Linked List",
        "Heap"
      ],
      correct: 2
    },
    {
      id: 5,
      question: "What is the time complexity of accessing an element in an array by index?",
      options: [
        "O(n)",
        "O(log n)",
        "O(1)",
        "O(n²)"
      ],
      correct: 2
    },
    {
      id: 6,
      question: "Which sorting algorithm has the best average-case time complexity?",
      options: [
        "Bubble Sort",
        "Insertion Sort",
        "Merge Sort",
        "Selection Sort"
      ],
      correct: 2
    },
    {
      id: 7,
      question: "What is the maximum number of nodes in a binary tree of height h?",
      options: [
        "2^h - 1",
        "2^(h+1) - 1",
        "2h",
        "h²"
      ],
      correct: 1
    },
    {
      id: 8,
      question: "Which data structure is best suited for implementing priority queue?",
      options: [
        "Array",
        "Linked List",
        "Heap",
        "Stack"
      ],
      correct: 2
    },
    {
      id: 9,
      question: "What is the space complexity of recursive factorial function?",
      options: [
        "O(1)",
        "O(n)",
        "O(log n)",
        "O(n²)"
      ],
      correct: 1
    },
    {
      id: 10,
      question: "Which traversal method visits nodes in order: left, root, right?",
      options: [
        "Preorder",
        "Inorder",
        "Postorder",
        "Level order"
      ],
      correct: 1
    }
  ]
};
