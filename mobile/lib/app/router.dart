import 'package:flutter/material.dart';

import '../features/classes/presentation/screens/classes_screen.dart';
import '../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../features/fees/presentation/screens/fees_screen.dart';
import '../features/more/presentation/screens/more_screen.dart';
import '../features/students/presentation/screens/students_screen.dart';

class ClassFlowShell extends StatefulWidget {
  const ClassFlowShell({super.key});

  @override
  State<ClassFlowShell> createState() => _ClassFlowShellState();
}

class _ClassFlowShellState extends State<ClassFlowShell> {
  int _selectedIndex = 0;

  static const List<Widget> _screens = [
    DashboardScreen(),
    ClassesScreen(),
    StudentsScreen(),
    FeesScreen(),
    MoreScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.school_rounded),
            label: 'Classes',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.groups_rounded),
            label: 'Students',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.payments_rounded),
            label: 'Fees',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.menu_rounded),
            label: 'More',
          ),
        ],
      ),
    );
  }
}
