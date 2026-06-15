import 'package:flutter/material.dart';

import '../shared/theme/app_theme.dart';
import 'router.dart';

class ClassFlowApp extends StatelessWidget {
  const ClassFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ClassFlow',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const ClassFlowShell(),
    );
  }
}
